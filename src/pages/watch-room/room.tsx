import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { ScrollRestoration, useNavigate, useParams } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DoorOpen,
  EllipsisVertical,
  Loader2,
  Megaphone,
  MonitorPlay,
  Settings2,
  Shuffle,
  Trash2
} from 'lucide-react';
import Player, { type PlayerHandle } from '@/components/custom/player';
import PlayShell, {
  PLAY_SIDEBAR_BODY_PADDED_CLASS,
  PLAY_SIDEBAR_HEADER_CLASS,
  PLAY_SIDEBAR_TAB_CLASS,
  PLAY_SIDEBAR_TAB_LIST_CLASS
} from '@/components/custom/play-shell';
import IconMenu, { type IconMenuItem } from '@/components/custom/icon-menu';
import { IconAction } from '@/components/custom/icon-button';
import PlayHeader from '@/pages/anime/play-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getPlayDetail,
  getDanmakuList,
  danmakuCreate,
  type DanmakuItem,
  type DanmakuData
} from '@/apis/play';
import type {
  PlaybackSync,
  WatchRoomMember,
  WatchRoomMessage,
  WatchRoomState
} from '@/apis/watch-room';
import {
  closeWatchRoomSocket,
  emitAck,
  getWatchRoomSocket,
  ROOM_EVENT,
  type PlaybackSyncPayload,
  type RoomClosedPayload,
  type RoomJoinAck,
  type RoomMemberJoinedPayload,
  type RoomMemberLeftPayload,
  type RoomStatePayload,
  type RoomUpdatedPayload
} from '@/apis/watch-room-socket';
import RoomChatPanel from './room-chat-panel';
import { createMessageStore } from './room-message-store';
import { ROOM_NAME_MAX } from './constants';
import RoomChatHeader from './room-chat-header';
import AnimePicker from './anime-picker';
import FormDialog from '@/components/custom/form-dialog';
import AnimeEpisode from '@/pages/anime/anime-episode';
import { NowPlaying } from './room-panel';
import { useAuthStore } from '@/store/auth';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { usePlayTheme } from '@/hooks/use-play-theme';
import { useSettings } from '@/lib/settings';
import { cn } from '@/lib/utils';
import type { ShareInfo } from '@/lib/share';

/** 弹幕存储的字符串 mode 与 artplayer 数值 mode 互转（与播放页一致） */
const toPluginMode = (mode: 'scroll' | 'top' | 'bottom') =>
  ({ scroll: 0, top: 1, bottom: 2 })[mode] as 0 | 1 | 2;
const toStorageMode = (mode: 0 | 1 | 2) =>
  ({ 0: 'scroll', 1: 'top', 2: 'bottom' })[mode] as 'scroll' | 'top' | 'bottom';

/** 播放偏差校正阈值（秒）：偏差较小时不强制跳转，避免网络抖动导致画面频繁跳动 */
const SYNC_DRIFT_THRESHOLD = 2;

/** 同步回放抑制窗口（ms）：吸收 seek/play/pause 触发的本地事件 */
const APPLY_SETTLE_MS = 120;

/** 周期校准间隔（ms）：服务端只在房主操作时广播，成员靠这里把漂移拉回来 */
const CALIBRATE_INTERVAL_MS = 12_000;

/** 断线宽限期（ms）：与服务端 DISCONNECT_GRACE_MS 对齐，超时未重连才退出房间 */
const RECONNECT_GRACE_MS = 30_000;

/** 外推上限（秒）：系统休眠等导致单调时钟跳变时兜底，避免一次巨大跳转 */
const MAX_EXTRAPOLATE_SECONDS = 120;

/** 加入房间的结果（请求与状态更新分离，便于 effect / 表单复用） */
type JoinResult =
  | { ok: true; state: WatchRoomState }
  | { ok: false; code?: string; message?: string };

/** 房间操作下拉菜单（分享链接走播放页 header 的分享按钮，这里不重复） */
const RoomDropdownMenu: React.FC<{
  isOwner: boolean;
  onEdit: () => void;
  onDissolve: () => void;
  onLeave: () => void;
}> = ({ isOwner, onEdit, onDissolve, onLeave }) => {
  const menuItems: IconMenuItem[] = isOwner
    ? [
        { icon: Settings2, label: '修改房间信息', onClick: onEdit },
        { icon: Trash2, label: '解散房间', onClick: onDissolve }
      ]
    : [{ icon: DoorOpen, label: '离开房间', onClick: onLeave }];

  return (
    <IconMenu
      title='房间操作'
      icon={EllipsisVertical}
      items={menuItems}
    />
  );
};

/** 待确认的危险操作（解散房间 / 移出成员） */
interface PendingConfirm {
  title: string;
  description: string;
  confirmText: string;
  run: () => void;
}

/**
 * 当前挂载中的房间视图（同一时刻最多一个）。
 * 房间页卸载后要延时补发 room:leave，用它判断是否已经重新进入同一房间
 * （严格模式双挂载、热更新、退出后立刻返回），避免自己把自己踢出去。
 */
let mountedRoomId: string | null = null;

/** 房间视图：由外层按 roomId 设置 key，切换房间时整体重建，不残留上一间房的状态 */
const RoomView: React.FC<{ roomId: string }> = ({ roomId }) => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();
  // 放映室与播放页同一套主题设置（PlayHeader 里的「播放页主题」，浅色/深色/跟随平台）
  usePlayTheme();
  // 自动连播开关与播放页共用（控制栏的连播图标改的就是它）
  const { autoNext } = useSettings();

  // 单例 socket：用惰性初始化拿，渲染期不再触发副作用（严格模式下也不会重复建连）
  const [socket] = useState(getWatchRoomSocket);
  /**
   * 实时消息的外部存储：socket 订阅写这里，聊天面板订阅它。
   * 不放进 state 是刻意的——每条消息都要写，state 会让整页跟着重渲。
   */
  const [messageStore] = useState(createMessageStore);
  const playerRef = useRef<PlayerHandle>(null);
  const applyingRef = useRef(false);
  const lastRevisionRef = useRef(-1);
  const leavingRef = useRef(false);
  const joinedRef = useRef(false);
  /** 当前已渲染的集（与播放器源同步），起播兜底时用它判断快照是否已过期 */
  const videoIdRef = useRef<string | null>(null);
  /** 自动连播的 ended 去重窗口（少数浏览器会重复触发，避免连跳两集） */
  const lastEndedAtRef = useRef(0);
  /**
   * 组件是否仍在挂载：换源兜底定时器在卸载后不能再发指令。
   * 卸载时顺手离开房间——socket 是单例，不会随页面卸载断开，服务端的 30s
   * 断线宽限期永远等不到，席位会一直挂在房间里（大厅还显示「继续待在」）。
   * 延时 800ms 再发：严格模式/热更新会立刻重挂载，重挂载会写回 mountedRoomId
   * 让这次离开作废，避免自己把自己踢出刚回到的房间。
   */
  const aliveRef = useRef(true);
  useEffect(() => {
    mountedRoomId = roomId;
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      if (mountedRoomId === roomId) mountedRoomId = null;
      if (!joinedRef.current || leavingRef.current) return;
      setTimeout(() => {
        if (mountedRoomId === roomId || leavingRef.current) return;
        void emitAck(socket, ROOM_EVENT.leave, { roomId });
      }, 800);
    };
  }, [roomId, socket]);
  /** 权威播放状态最新快照（外推与换集判断用） */
  const playbackRef = useRef<PlaybackSync | null>(null);
  /**
   * 服务端时刻 → 本地单调时刻的锚点，由 playback:pull 的往返折半估算：
   * 取 (发送时刻 + 接收时刻) / 2 视为 serverTime 对应的本地时刻，把单程网络
   * 延迟抵消掉。为空时退化为「收到即此刻」，即不做延迟补偿。
   */
  const clockAnchorRef = useRef<{ serverTime: number; perf: number } | null>(
    null
  );
  /** 断线重连的宽限计时器 */
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<WatchRoomState | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  /** 播放器初始化/换源时要定位到的秒数 */
  const [initialTime, setInitialTime] = useState(0);
  const [tab, setTab] = useState<'chat' | 'playlist'>('chat');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAnnouncement, setEditAnnouncement] = useState('');
  const [saving, setSaving] = useState(false);
  /** 公开状态提交中（等 ACK 落地再放开开关，避免连点） */
  const [visibilityPending, setVisibilityPending] = useState(false);
  /** 转私人时的密码表单：公开房间不保留密码，必须现场设一个 */
  const [visibilityOpen, setVisibilityOpen] = useState(false);
  const [visibilityPassword, setVisibilityPassword] = useState('');
  // retryable=false 的失败是终态（被移出/房间已解散），重试没有意义
  const [joinFailed, setJoinFailed] = useState<{
    message: string;
    retryable: boolean;
  } | null>(null);
  /** 私人房间缺密码时展示密码表单 */
  const [needPassword, setNeedPassword] = useState(false);
  /** 断线后处于宽限期重连中（网络闪断不退出房间） */
  const [reconnecting, setReconnecting] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const isOwner = state?.me.role === 'owner';
  // 房间名进浏览器标题：侧栏 header 让给 tab 后，房间名在页面上不再占位
  useDocumentTitle(state?.name ?? '放映室');

  // ---------- 播放同步 ----------
  /** 服务端时间戳对应的本地单调时刻（未测出锚点时按「此刻」处理） */
  const serverTimeToPerf = useCallback((serverTime: number) => {
    const anchor = clockAnchorRef.current;
    return anchor
      ? anchor.perf + (serverTime - anchor.serverTime)
      : performance.now();
  }, []);

  /**
   * 应用权威播放状态
   *
   * 快照里的 position 是「serverTime 那一刻」的位置（服务端已按时间外推过），
   * 所以本地目标 = position + 本地已流逝秒数。流逝秒数用锚点换算后的单调时钟
   * 差计算：既不受客户端时钟偏差影响（不能拿 Date.now() 减 serverTime），
   * 也不把单程网络延迟算进进度。
   */
  const applyPlayback = useCallback(
    (playback: PlaybackSync, options?: { force?: boolean }) => {
      playbackRef.current = playback;
      const player = playerRef.current;
      if (!player) return;

      const elapsed = playback.isPlaying
        ? Math.min(
            MAX_EXTRAPOLATE_SECONDS,
            Math.max(
              0,
              (performance.now() - serverTimeToPerf(playback.serverTime)) / 1000
            )
          )
        : 0;
      const target = Math.max(0, playback.position + elapsed);
      applyingRef.current = true;

      // 偏差较小（播放中）时不强制跳转，避免网络抖动导致画面频繁跳动
      const drift = Math.abs(player.getTime() - target);
      if (
        options?.force ||
        !playback.isPlaying ||
        drift > SYNC_DRIFT_THRESHOLD ||
        Number.isNaN(drift)
      ) {
        player.seek(target);
      }
      if (playback.isPlaying) player.play();
      else player.pause();

      setTimeout(() => {
        applyingRef.current = false;
      }, APPLY_SETTLE_MS);
    },
    [serverTimeToPerf]
  );

  /** 接受一份权威快照：换集时重置定位基准，再交给播放器应用 */
  const acceptPlayback = useCallback(
    (playback: PlaybackSync) => {
      if (playback.videoId !== playbackRef.current?.videoId) setInitialTime(0);
      videoIdRef.current = playback.videoId;
      setVideoId(playback.videoId);
      applyPlayback(playback);
    },
    [applyPlayback]
  );

  /**
   * 周期校准：主动拉一次权威状态，同时用 ACK 往返估算时钟锚点。
   *
   * 服务端只在房主操作时广播，成员被拦自动播放、缓冲卡顿或切后台回来后不会
   * 自动纠偏，只能等房主下一次点击。这里每 12s（以及回到前台时）对一次表，
   * 偏差小于阈值时不动画面，超过阈值才 seek。
   */
  const calibrate = useCallback(async () => {
    // 断开期间不发：Socket.IO 会缓冲事件并在重连后一次性补发，造成无谓的重复拉取
    if (!socket.connected) return;

    const sentAt = performance.now();
    const result = await emitAck<PlaybackSync>(socket, ROOM_EVENT.pull, {
      roomId
    });
    const receivedAt = performance.now();
    if (!result.success || !result.data) return;

    clockAnchorRef.current = {
      serverTime: result.data.serverTime,
      perf: (sentAt + receivedAt) / 2
    };
    // 拉取可能比本地已收到的广播更新（漏推/断线），版本号只升不降
    lastRevisionRef.current = Math.max(
      lastRevisionRef.current,
      result.data.revision
    );
    acceptPlayback(result.data);
  }, [acceptPlayback, roomId, socket]);

  const applyRoomState = useCallback((next: WatchRoomState) => {
    setState(next);
    playbackRef.current = next.playback;
    videoIdRef.current = next.playback.videoId;
    setVideoId(next.playback.videoId);
    setInitialTime(next.playback.position);
  }, []);

  // ---------- 加入房间（Socket 唯一入口，含全平台单房间规则） ----------
  /** 只负责发请求，状态更新交给调用方（避免在 effect 里同步 setState） */
  const requestJoin = useCallback(
    async (password?: string): Promise<JoinResult> => {
      const result = await emitAck<RoomJoinAck>(socket, ROOM_EVENT.join, {
        roomId,
        ...(password ? { password } : {})
      });
      if (!result.success) {
        return {
          ok: false,
          code: result.error?.code,
          message: result.error?.message
        };
      }
      return { ok: true, state: result.data.state };
    },
    [roomId, socket]
  );

  const applyJoinResult = useCallback(
    (result: JoinResult) => {
      if (!result.ok) {
        // 私人房间：服务端对「没带密码」返回 ROOM_PRIVATE、对「密码错」返回
        // ROOM_PASSWORD_INVALID，两种都落到密码表单（后者由提交处提示错误）
        if (
          result.code === 'ROOM_PRIVATE' ||
          result.code === 'ROOM_PASSWORD_INVALID'
        ) {
          setNeedPassword(true);
          setJoinFailed(null);
          return;
        }
        // 被房主移出过：直接落到失败页（否则密码表单会一直拦在前面）
        if (result.code === 'ROOM_BANNED') {
          setNeedPassword(false);
          setJoinFailed({
            message: result.message ?? '你已被房主移出该房间，无法再加入',
            retryable: false
          });
          return;
        }
        // 房间已被解散/清理：顺手把大厅列表的缓存作废，返回时不会再看到它
        if (result.code === 'ROOM_NOT_FOUND') {
          queryClient.removeQueries({ queryKey: ['watch-room-rooms'] });
          setJoinFailed({
            message: '房间已不存在，可能已被解散',
            retryable: false
          });
          return;
        }
        setJoinFailed({
          message: result.message ?? '加入房间失败',
          retryable: true
        });
        return;
      }

      joinedRef.current = true;
      setNeedPassword(false);
      setJoinFailed(null);
      lastRevisionRef.current = result.state.playback.revision;
      applyRoomState(result.state);
      // 立刻对一次表：建立时钟锚点，首个 seek 就带上延迟补偿
      void calibrate();
    },
    [applyRoomState, calibrate, queryClient]
  );

  useEffect(() => {
    void requestJoin().then(applyJoinResult);
  }, [requestJoin, applyJoinResult]);

  /** 密码表单提交：服务端对「没给密码」和「密码错」返回同一个错误码，这里区分提示 */
  const handlePasswordSubmit = async () => {
    if (!passwordInput || joining) return;
    setJoining(true);
    setPasswordError(null);
    const result = await requestJoin(passwordInput);
    setJoining(false);
    applyJoinResult(result);
    if (!result.ok && result.code === 'ROOM_PASSWORD_INVALID') {
      setPasswordError('密码不正确，请重试');
      setPasswordInput('');
    }
  };

  // ---------- Socket 事件订阅 ----------

  /**
   * 离开房间后清掉大厅的两份缓存：
   * - `watch-room-current`：「回到房间」入口
   * - `watch-room-rooms`：列表里刚解散的那个房间
   */
  const clearCurrentRoom = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['watch-room-current'] });
    queryClient.removeQueries({ queryKey: ['watch-room-rooms'] });
  }, [queryClient]);

  const exitToLobby = useCallback(
    (toastMessage?: string) => {
      leavingRef.current = true;
      clearCurrentRoom();
      if (toastMessage) toast.info(toastMessage);
      navigate('/watch-room');
    },
    [clearCurrentRoom, navigate]
  );

  useEffect(() => {
    const onState = ({ roomId: rid, state: s }: RoomStatePayload) => {
      // 连接建立（含断线重连）时服务端会推一次房间状态；不在任何房间时 state 为 null。
      // 只处理当前房间，且只有「已加入过」才说明是被移出/房间已解散。
      if (rid !== roomId) return;
      if (!s) {
        if (joinedRef.current) exitToLobby('你已不在该房间');
        return;
      }
      joinedRef.current = true;
      applyRoomState(s);
      // 重连后直接把进度拉回权威位置（断网期间本地还在播，不校正就对不上了）
      acceptPlayback(s.playback);
    };
    const onSync = ({ playback, roomId: rid }: PlaybackSyncPayload) => {
      if (rid !== roomId || playback.revision <= lastRevisionRef.current)
        return;
      lastRevisionRef.current = playback.revision;
      acceptPlayback(playback);
    };
    // 聊天与系统通知统一走 room:message，载荷就是消息本体。
    // 切房间瞬间可能还会收到旧房间的广播，按 roomId 丢弃
    const onMessage = (message: WatchRoomMessage) => {
      if (message.roomId !== roomId) return;
      messageStore.append(message);
    };
    const onMemberJoined = ({
      roomId: rid,
      member
    }: RoomMemberJoinedPayload) => {
      if (rid !== roomId) return;
      setState(s =>
        s && !s.members.some(m => m.userId === member.userId)
          ? { ...s, members: [...s.members, member] }
          : s
      );
    };
    const onMemberLeft = ({
      roomId: rid,
      userId,
      reason
    }: RoomMemberLeftPayload) => {
      // 切房间时服务端会给旧房间广播一条 member-left（本人也会收到），
      // 不认 roomId 会被误判成「你已离开房间」而弹回大厅
      if (rid !== roomId) return;
      // 离开者/被踢者本人也会收到该事件
      if (userId === user?.id) {
        if (!leavingRef.current) {
          exitToLobby(reason === 'kicked' ? '你已被移出房间' : '你已离开房间');
        }
        return;
      }
      setState(s =>
        s ? { ...s, members: s.members.filter(m => m.userId !== userId) } : s
      );
    };
    const onClosed = ({ roomId: rid, content }: RoomClosedPayload) => {
      if (rid !== roomId) return;
      // 主动解散时不再重复提示（已经点了按钮）
      exitToLobby(leavingRef.current ? undefined : content || '房间已解散');
    };
    const onUpdated = ({
      roomId: rid,
      name,
      announcement,
      visibility
    }: RoomUpdatedPayload) => {
      if (rid !== roomId) return;
      setState(s => (s ? { ...s, name, announcement, visibility } : s));
    };
    const onReplaced = () => {
      if (leavingRef.current) return;
      exitToLobby('你的账号已在其他设备/页面登录');
      // 账号已被新连接顶替：断开并停止自动重连，避免两个页面互相顶号
      closeWatchRoomSocket();
    };
    const onDisconnect = (reason: string) => {
      // 客户端主动断开（被顶替后 closeWatchRoomSocket、切换房间）不进入重连流程
      if (leavingRef.current || reason === 'io client disconnect') return;
      // 服务端给了 30s 宽限期保留席位，本地同样等这么久：
      // 网络闪断/切后台回来能原地恢复，超时才认为确实离开了房间
      setReconnecting(true);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        if (!leavingRef.current) exitToLobby('连接已断开，你已离开房间');
      }, RECONNECT_GRACE_MS);
    };
    const onConnect = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      // 房间状态由服务端随连接重推（见 onState），这里只收起提示
      setReconnecting(false);
    };

    socket.on('room:state', onState);
    socket.on('playback:sync', onSync);
    socket.on('room:message', onMessage);
    socket.on('room:member-joined', onMemberJoined);
    socket.on('room:member-left', onMemberLeft);
    socket.on('room:closed', onClosed);
    socket.on('room:updated', onUpdated);
    socket.on('session:replaced', onReplaced);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('room:state', onState);
      socket.off('playback:sync', onSync);
      socket.off('room:message', onMessage);
      socket.off('room:member-joined', onMemberJoined);
      socket.off('room:member-left', onMemberLeft);
      socket.off('room:closed', onClosed);
      socket.off('room:updated', onUpdated);
      socket.off('session:replaced', onReplaced);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [
    roomId,
    socket,
    acceptPlayback,
    applyRoomState,
    exitToLobby,
    messageStore,
    user?.id
  ]);

  // ---------- 周期校准（房主自己的播放器就是权威来源，只需校正成员） ----------
  const inRoom = state !== null;
  useEffect(() => {
    if (!inRoom || isOwner) return;

    const timer = setInterval(() => {
      // 后台标签页没人看，不做无谓请求
      if (document.visibilityState !== 'visible') return;
      void calibrate();
    }, CALIBRATE_INTERVAL_MS);

    // 从后台切回时立刻对一次表，不必等下一个周期
    const onVisible = () => {
      if (document.visibilityState === 'visible') void calibrate();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [calibrate, inRoom, isOwner]);

  // ---------- 本地播放事件（区分用户主动操作与同步回放） ----------
  // 播放器按 props 浅比较 memo，这里一律 useCallback：回调身份稳定，房内其他
  // 状态（成员进出、切 tab、弹窗）变化时播放器不参与重渲
  /** 房主的本地操作：发 Socket 指令，用 ACK 返回的权威状态回填 */
  const controlPlayback = useCallback(
    (event: string, payload: Record<string, unknown> = {}) => {
      if (!isOwner) return;
      void emitAck<PlaybackSync>(socket, event, { roomId, ...payload }).then(
        result => {
          if (!result.success) {
            toast.error(result.error?.message ?? '操作失败');
            return;
          }
          // 服务端同时会广播给所有人（含自己），这里用 ACK 回填少等一个来回
          if (result.data) {
            lastRevisionRef.current = result.data.revision;
            acceptPlayback(result.data);
          }
        }
      );
    },
    [acceptPlayback, isOwner, roomId, socket]
  );

  /**
   * 非房主的本地操作一律回拉：服务端不接受成员的播放控制，
   * 本地要是被改了就按当前权威快照强制对齐（含控制台直接调 video.play/pause
   * 或改 currentTime，事件最终都会走到这里）。
   */
  const resyncLocal = useCallback(() => {
    const playback = playbackRef.current;
    if (playback) applyPlayback(playback, { force: true });
  }, [applyPlayback]);

  const handleLocalPlay = useCallback(() => {
    if (applyingRef.current) return;
    if (!isOwner) return resyncLocal();
    controlPlayback(ROOM_EVENT.play);
  }, [controlPlayback, isOwner, resyncLocal]);

  const handleLocalPause = useCallback(() => {
    if (applyingRef.current) return;
    if (!isOwner) return resyncLocal();
    controlPlayback(ROOM_EVENT.pause);
  }, [controlPlayback, isOwner, resyncLocal]);

  const handleLocalSeek = useCallback(
    (time: number) => {
      if (applyingRef.current) return;
      if (!isOwner) return resyncLocal();
      controlPlayback(ROOM_EVENT.seek, { position: time });
    },
    [controlPlayback, isOwner, resyncLocal]
  );

  /** 播放器就绪：补上「挂载前收到的同步」（加入房间那次），按锚点外推 */
  const handlePlayerReady = useCallback(() => {
    const playback = playbackRef.current;
    if (playback) applyPlayback(playback, { force: true });
  }, [applyPlayback]);

  // ---------- 当前视频播放数据（含弹幕） ----------
  const { data: playDetail, isPending: videoPending } = useQuery({
    queryKey: ['play-detail', videoId],
    queryFn: () => getPlayDetail(videoId!),
    enabled: !!videoId,
    placeholderData: keepPreviousData
  });

  const { data: danmakuRes } = useQuery({
    queryKey: ['danmakus', videoId],
    queryFn: () => getDanmakuList(videoId!),
    enabled: !!videoId,
    placeholderData: keepPreviousData
  });

  const danmakus: DanmakuItem[] = useMemo(
    () =>
      (danmakuRes?.items ?? []).map(d => ({
        text: d.text,
        color: d.color,
        mode: toPluginMode(d.mode),
        time: d.time
      })),
    [danmakuRes]
  );

  const handleDanmuEmit = useCallback(
    async (danmu: DanmakuItem): Promise<boolean> => {
      if (!videoId) return false;
      const data: DanmakuData = {
        text: danmu.text,
        color: danmu.color!,
        mode: toStorageMode(danmu.mode!),
        time: danmu.time!
      };
      try {
        await danmakuCreate(videoId, data);
        // 追加到本地缓存，避免 staleTime 内重进该集看不到刚发的弹幕
        queryClient.setQueryData<{ items: DanmakuData[] }>(
          ['danmakus', videoId],
          prev => prev && { items: [...prev.items, data] }
        );
        return true;
      } catch {
        return false;
      }
    },
    [queryClient, videoId]
  );

  // ---------- 房间操作（建房/离开/踢人/改信息全部走 Socket，HTTP 侧只有查询） ----------
  /** 统一 ACK 包装：失败弹 toast，返回是否成功 */
  const roomAction = useCallback(
    async (
      event: string,
      payload: Record<string, unknown>,
      fallback: string
    ) => {
      const result = await emitAck<unknown>(socket, event, payload);
      if (!result.success) {
        toast.error(result.error?.message ?? fallback);
        return false;
      }
      return true;
    },
    [socket]
  );

  const handleOpenEdit = () => {
    setEditName(state?.name ?? '');
    setEditAnnouncement(state?.announcement ?? '');
    setEditOpen(true);
  };

  const handleSaveRoom = async () => {
    setSaving(true);
    const saved = await roomAction(
      ROOM_EVENT.update,
      { roomId, name: editName.trim(), announcement: editAnnouncement.trim() },
      '保存失败'
    );
    setSaving(false);
    if (saved) setEditOpen(false);
  };

  /**
   * 切换公开状态（房主）。
   * 公开 → 私人必须带密码（公开期间不保留密码）；私人 → 直接公开。
   * 服务端会广播 room:updated，本地也顺手更新一次，省一个来回的延迟。
   */
  const handleToggleVisibility = async (
    nextPublic: boolean,
    password?: string
  ) => {
    const visibility = nextPublic ? 'public' : 'private';
    setVisibilityPending(true);
    const saved = await roomAction(
      ROOM_EVENT.update,
      { roomId, visibility, ...(password ? { password } : {}) },
      '切换失败'
    );
    setVisibilityPending(false);
    if (!saved) return false;

    setState(s => (s ? { ...s, visibility } : s));
    toast.success(
      nextPublic
        ? '房间已公开，会出现在放映室大厅'
        : '房间已设为私人，凭链接和密码进入'
    );
    return true;
  };

  const handleOpenVisibility = (nextPublic: boolean) => {
    // 成员没有权限；提交中也忽略抖动
    if (!isOwner || visibilityPending) return;
    if (nextPublic) {
      void handleToggleVisibility(true);
      return;
    }
    setVisibilityPassword('');
    setVisibilityOpen(true);
  };

  const handleConfirmPrivate = async () => {
    const password = visibilityPassword.trim();
    if (password.length < 4) return;
    const done = await handleToggleVisibility(false, password);
    if (done) setVisibilityOpen(false);
  };

  /** 房主从头像菜单移出成员：先确认，再走 member:kick（对方立即离场） */
  const handleKickMember = (member: WatchRoomMember) => {
    setConfirm({
      title: `移出「${member.nickname}」`,
      description: '对方会立即离开房间，并且不能再加入这个房间。',
      confirmText: '移出',
      run: () =>
        void roomAction(
          ROOM_EVENT.kick,
          { roomId, userId: member.userId },
          '移出失败'
        )
    });
  };

  /** 房主离开 = 解散房间（服务端语义），成员离开 = 退出房间 */
  const handleLeave = async (dissolve: boolean) => {
    leavingRef.current = true;
    const done = await roomAction(
      ROOM_EVENT.leave,
      { roomId },
      dissolve ? '解散房间失败' : '离开房间失败'
    );
    if (done) {
      clearCurrentRoom();
      navigate('/watch-room');
      return;
    }
    leavingRef.current = false;
  };

  // ---------- 视频切换（房主：选集点选 + 搜索其他动漫） ----------
  const changeVideoMutation = useMutation({
    mutationFn: (input: { videoId: string; autoplay?: boolean }) =>
      emitAck<PlaybackSync>(socket, ROOM_EVENT.changeVideo, {
        roomId,
        videoId: input.videoId,
        // 自动连播：服务端切集时直接置「播放中、位置 0」，一次广播到位
        ...(input.autoplay ? { autoplay: true } : {})
      }),
    onSuccess: result => {
      if (!result.success || !result.data) {
        toast.error(result.error?.message ?? '切换视频失败');
        return;
      }
      lastRevisionRef.current = result.data.revision;
      // 服务端切换视频后把进度重置为 0；acceptPlayback 会识别换集并重置定位基准
      acceptPlayback(result.data);
    }
  });
  // v5 的 mutate 引用稳定：单独取出来，回调依赖它而不是整个 mutation 对象
  const changeVideo = changeVideoMutation.mutate;

  /**
   * 本地起播兜底：房间状态是「播放中」而本地没播，就补一次 play。
   *
   * 换集时服务端已把状态置为播放中，正常情况下 `applyPlayback` 会直接起播；
   * 但新源尚未就绪时浏览器会拒绝 play()，且两集指向同一地址时根本不会触发换源
   * 事件，所以这里在换源就绪、以及换集后的几个时间点各补一次，直到真的播起来。
   * 只作用于本地，不再发 Socket 指令（服务端状态本来就对）。
   */
  const resumeLocalPlayback = useCallback((attempt = 0) => {
    // 重试递归写成内层函数：回调本身要 useCallback 稳定身份，
    // 不能在自己的函数体里引用自己（react-compiler 判为「用前声明」）
    const tryPlay = (retry: number) => {
      if (!aliveRef.current) return;
      const playback = playbackRef.current;
      // 用 ref 比对当前集：调用点常在 setTimeout 里，闭包里的 videoId 是旧值
      if (!playback?.isPlaying || playback.videoId !== videoIdRef.current) {
        return;
      }
      const player = playerRef.current;
      if (!player || player.isPlaying()) return;

      applyingRef.current = true;
      player.play();
      setTimeout(() => {
        applyingRef.current = false;
      }, APPLY_SETTLE_MS);

      // 媒体还没就绪时 play() 会失败，隔一会儿再试（最多 4 次）
      if (retry < 3) setTimeout(() => tryPlay(retry + 1), 800);
    };

    tryPlay(attempt);
  }, []);

  const handleSelectVideo = useCallback(
    (vid: string) => {
      // 成员无播放控制权：服务端会拒绝，这里直接拦截避免无效请求
      if (!isOwner || !vid || vid === videoId) return;
      // 手动选集与自动连播一致：切完直接从 0 起播，全场随广播一起换集
      changeVideo({ videoId: vid, autoplay: true });
      // 两集指向同一地址时没有换源事件，靠这里接管起播（与自动连播同处理）
      setTimeout(() => resumeLocalPlayback(), 600);
    },
    [changeVideo, isOwner, resumeLocalPlayback, videoId]
  );

  // ---------- 自动连播（房主）：播完把房间切到下一集，全员随广播换集 ----------
  /** 当前集的下一集；换集瞬间 playDetail 还是上一集的占位数据，不参与判断 */
  const findNextVideo = useCallback(() => {
    if (!playDetail || playDetail.video.id !== videoId) return null;
    return (
      [...playDetail.videos]
        .sort((a, b) => a.episode - b.episode)
        .find(item => item.episode > playDetail.video.episode) ?? null
    );
  }, [playDetail, videoId]);

  /** 临近结尾预取下一集详情与弹幕，换集时不至于黑屏等接口 */
  const handleNearEnd = useCallback(() => {
    const next = findNextVideo();
    if (!next) return;
    void queryClient.prefetchQuery({
      queryKey: ['play-detail', next.id],
      queryFn: () => getPlayDetail(next.id)
    });
    void queryClient.prefetchQuery({
      queryKey: ['danmakus', next.id],
      queryFn: () => getDanmakuList(next.id)
    });
  }, [findNextVideo, queryClient]);

  const handleEnded = useCallback(() => {
    // 换片只有房主有权：成员播完停在结尾，等房主（或房主的自动连播）推进
    if (!isOwner) return;
    if (Date.now() - lastEndedAtRef.current < 1000) return;
    lastEndedAtRef.current = Date.now();
    const next = autoNext ? findNextVideo() : null;
    if (!next) {
      // 播完即停：不把「播放中」留在服务端，否则成员会被一直外推到片尾之后
      controlPlayback(ROOM_EVENT.pause);
      return;
    }
    changeVideo({ videoId: next.id, autoplay: true });
    // 同地址换集不会有换源事件，靠这里接管起播
    setTimeout(() => resumeLocalPlayback(), 600);
  }, [
    autoNext,
    changeVideo,
    controlPlayback,
    findNextVideo,
    isOwner,
    resumeLocalPlayback
  ]);

  // ---------- 私人房间：密码补齐 ----------
  if (needPassword) {
    return (
      <div className='flex min-h-screen flex-col'>
        <PlayHeader />
        <main className='flex flex-1 items-center justify-center'>
          <form
            className='w-full max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl bg-card p-6'
            onSubmit={event => {
              event.preventDefault();
              void handlePasswordSubmit();
            }}
          >
            <div className='flex flex-col gap-3 text-center sm:text-left select-none'>
              <h2 className='text-lg leading-none font-semibold sm:text-left'>
                私人放映室
              </h2>
            </div>

            <div className='mt-5 space-y-2'>
              <Input
                id='room-password-input'
                type='password'
                value={passwordInput}
                maxLength={32}
                autoFocus
                placeholder='请输入房间密码'
                onChange={e => setPasswordInput(e.target.value)}
              />
              {passwordError && (
                <p className='text-xs text-destructive'>{passwordError}</p>
              )}
            </div>

            <Button
              type='submit'
              className='mt-5 w-full'
              disabled={!passwordInput || joining}
            >
              {joining && <Loader2 className='size-4 animate-spin' />}
              进入房间
            </Button>
          </form>
        </main>
      </div>
    );
  }

  // ---------- 加载与失败态 ----------

  if (joinFailed) {
    return (
      <div className='flex min-h-screen flex-col'>
        <PlayHeader />
        <main className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl bg-card p-6'>
            <div className='flex flex-col gap-3 text-center sm:text-left select-none'>
              <h2 className='text-lg leading-none font-semibold sm:text-left'>
                {joinFailed.message}
              </h2>
            </div>

            <div
              className={cn(
                'mt-5 grid gap-2',
                joinFailed.retryable ? 'grid-cols-2' : 'grid-cols-1'
              )}
            >
              {joinFailed.retryable && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setJoinFailed(null);
                    void requestJoin().then(applyJoinResult);
                  }}
                >
                  重试
                </Button>
              )}
              <Button onClick={() => navigate('/watch-room')}>返回大厅</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!state) {
    return (
      <div className='flex min-h-screen flex-col'>
        <PlayHeader />
        <div className='flex flex-1 items-center justify-center gap-3 text-muted-foreground'>
          <Loader2 className='size-5 animate-spin' />
          <p className='text-xs'>正在入场…</p>
        </div>
      </div>
    );
  }

  const chatDisabled = !state.members.some(m => m.userId === user?.id);

  /** 当前在放什么：优先用播放详情（换集后最新），回落到房间快照 */
  const nowPlaying = playDetail
    ? {
        cover: playDetail.cover,
        animeName: playDetail.name,
        episode: playDetail.video.episode,
        status: playDetail.status,
        type: playDetail.type,
        tags: playDetail.tags,
        description: playDetail.description,
        videoCount: playDetail.videoCount,
        // 评分是 5 分制原始值，展示交给 formatScore 折算成 10 分制
        avgScore: playDetail.avgScore,
        playCount: playDetail.playCount,
        collectionCount: playDetail.collectionCount
      }
    : state.currentVideo
      ? {
          cover: state.currentVideo.animeCover,
          animeName: state.currentVideo.animeName,
          episode: state.currentVideo.episode
        }
      : null;

  /**
   * 邀请文案：header 的分享按钮与聊天页「邀请」共用同一份，两处口径才不会打架。
   * 语气跟播放页的「我在看《X》第N话，一起来追番吧！」保持一致（房主与成员都在房里，
   * 所以用「我在……看」而不是「我开了个房」）；私人房不把密码写进去——房主可能随时改、
   * 也不该留在对方的转发记录里，只提示「单独问我要」，让对方知道还有一道门。
   */
  const inviteShare: ShareInfo = {
    title: nowPlaying
      ? `我在 Qnya 放映室看《${nowPlaying.animeName}》${
          nowPlaying.episode ? `第${nowPlaying.episode}话` : ''
        }，一起来看吧！`
      : '我在 Qnya 放映室等你，一起来看番吧！',
    note:
      state.visibility === 'private' ? '私人房间，密码单独问我要' : undefined,
    successText: '邀请文案已复制，发给好友吧'
  };

  return (
    <>
      {/* 路由切换重置窗口滚动条（与播放页一致） */}
      <ScrollRestoration />
      <PlayHeader share={inviteShare} />
      <PlayShell
        sidebarClassName='min-h-80 grow lg:min-h-0'
        player={
          <>
            {reconnecting && (
              <div className='absolute inset-x-0 top-4 z-30 flex justify-center'>
                <div className='flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3.5 py-1.5 text-xs text-white backdrop-blur'>
                  <span className='size-1.5 rounded-full bg-amber-400 motion-safe:animate-pulse' />
                  网络中断，正在重连
                  <span className='text-white/45'>房间保留 30 秒</span>
                </div>
              </div>
            )}

            {videoId && !videoPending && playDetail ? (
              <Player
                ref={playerRef}
                url={playDetail.video.url}
                time={initialTime}
                danmaku={danmakus}
                onDanmuEmit={handleDanmuEmit}
                onReady={handlePlayerReady}
                onLocalPlay={handleLocalPlay}
                onLocalPause={handleLocalPause}
                onLocalSeek={handleLocalSeek}
                onNearEnd={handleNearEnd}
                onEnded={handleEnded}
                onSwitchReady={resumeLocalPlayback}
                // 成员端只留画面与音量：播放/暂停、倍速、连播由房主统一控制。
                // 清晰度例外——各端按自己网速挑档位，只改本地 hls level，不参与房间同步
                viewerMode={!isOwner}
                // 房主也不给倍速：本地倍速会与房间墙钟进度持续漂移
                showSpeed={false}
              />
            ) : (
              <div className='flex aspect-video w-full flex-col items-center justify-center gap-4 lg:aspect-auto lg:h-full'>
                {videoPending ? (
                  <Skeleton className='size-full rounded-none' />
                ) : (
                  <>
                    <div className='flex size-15 items-center justify-center rounded-full border border-white/10 text-white/40'>
                      <MonitorPlay className='size-6' />
                    </div>
                    <p className='text-sm text-white/45'>
                      {isOwner ? '还没开始放映，先选一集吧' : '房主还没有选片'}
                    </p>
                    {isOwner && (
                      <Button
                        className='h-8 rounded-sm px-3 text-xs'
                        onClick={() => setPickerOpen(true)}
                      >
                        选择要放映的剧集
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        }
        sidebar={
          pickerOpen ? (
            <AnimePicker
              currentAnimeId={playDetail?.animeId}
              onClose={() => setPickerOpen(false)}
              onPick={videoId => {
                setPickerOpen(false);
                handleSelectVideo(videoId);
              }}
            />
          ) : (
            <Tabs
              value={tab}
              onValueChange={v => setTab(v as 'chat' | 'playlist')}
              className='flex min-h-0 flex-1 flex-col'
            >
              {/* header：与播放页同为侧栏 header 行，内容换成「聊天 / 播放列表」两个 tab */}
              <div className={PLAY_SIDEBAR_HEADER_CLASS}>
                <TabsList className={PLAY_SIDEBAR_TAB_LIST_CLASS}>
                  <TabsTrigger
                    value='chat'
                    className={cn(PLAY_SIDEBAR_TAB_CLASS, 'gap-0')}
                  >
                    <span>聊天</span>
                    <span className='text-xs font-normal text-muted-foreground'>
                      （{state.members.length}人）
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value='playlist'
                    className={PLAY_SIDEBAR_TAB_CLASS}
                  >
                    播放列表
                  </TabsTrigger>
                </TabsList>

                <RoomDropdownMenu
                  isOwner={isOwner}
                  onEdit={handleOpenEdit}
                  onDissolve={() =>
                    setConfirm({
                      title: '解散房间',
                      description:
                        '房间、成员与聊天记录都会被删除，已加入的人会立即退出。',
                      confirmText: '解散',
                      run: () => void handleLeave(true)
                    })
                  }
                  onLeave={() => void handleLeave(false)}
                />
              </div>

              <TabsContent
                value='chat'
                className='flex min-h-0 flex-1 flex-col md:overflow-auto'
              >
                <RoomChatHeader
                  visibility={state.visibility}
                  members={state.members}
                  currentUserId={user?.id}
                  isOwner={isOwner}
                  pending={visibilityPending}
                  onToggleVisibility={handleOpenVisibility}
                  onKick={handleKickMember}
                  share={inviteShare}
                />

                {/* 公告跟聊天放一起：边看边说的时候也能看到房主写的话 */}
                {state.announcement && (
                  <div className='flex-none px-3 pt-3'>
                    <div className='flex gap-1.5 rounded-sm bg-card px-3 py-2'>
                      <Megaphone className='mt-0.5 size-3.5 flex-none text-primary' />
                      <p
                        className='line-clamp-3 text-xs leading-relaxed whitespace-pre-line text-muted-foreground'
                        title={state.announcement}
                      >
                        {state.announcement}
                      </p>
                    </div>
                  </div>
                )}

                <div className='flex min-h-0 flex-1 flex-col'>
                  <RoomChatPanel
                    roomId={roomId}
                    socket={socket}
                    messages={messageStore}
                    currentUserId={user?.id}
                    disabled={chatDisabled}
                  />
                </div>
              </TabsContent>

              {/* 播放列表：正在放映 + 选集（房主可切集/换片） */}
              <TabsContent
                value='playlist'
                className={cn(PLAY_SIDEBAR_BODY_PADDED_CLASS, 'flex flex-col')}
              >
                <div className='flex-none'>
                  <NowPlaying info={nowPlaying} />
                </div>

                {playDetail && (
                  // 选集卡片吃掉剩余高度（随侧栏高度自适应），列表内部滚动。
                  // 移动端侧栏没有固定高度、整页滚动，用 60dvh 兜个上限，
                  // 否则 50 集会一路铺到页尾；min-h-40 是高度实在不够时的下限
                  <div className='mt-4 flex max-h-[60dvh] min-h-40 flex-1 flex-col lg:max-h-none'>
                    <AnimeEpisode
                      fill
                      className='flex-1'
                      detail={playDetail}
                      currentVideoId={videoId ?? undefined}
                      readOnly={!isOwner}
                      pendingVideoId={
                        changeVideoMutation.isPending
                          ? changeVideoMutation.variables?.videoId
                          : undefined
                      }
                      onSelectVideo={handleSelectVideo}
                      actions={
                        isOwner && (
                          <>
                            {/* 两个图标离太近会看成一类操作，用细线隔开 */}
                            <span className='h-4 w-px bg-muted-foreground/40' />
                            <IconAction
                              title='换一部'
                              aria-label='换一部'
                              onClick={() => setPickerOpen(true)}
                            >
                              <Shuffle size={20} />
                            </IconAction>
                          </>
                        )
                      }
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )
        }
      />

      {/* 危险操作确认 */}
      <FormDialog
        open={confirm !== null}
        onOpenChange={open => {
          if (!open) setConfirm(null);
        }}
        title={confirm?.title ?? ''}
        description={confirm?.description}
        confirmText={confirm?.confirmText}
        onConfirm={() => {
          // 先关弹窗再执行：移出成员后房间还在，不能依赖页面卸载收弹窗
          const pendingConfirm = confirm;
          setConfirm(null);
          pendingConfirm?.run();
        }}
      />

      {/* 转私人：必须现场设一个密码（公开期间房间不保留密码） */}
      <FormDialog
        open={visibilityOpen}
        onOpenChange={open => {
          setVisibilityOpen(open);
          if (!open) setVisibilityPassword('');
        }}
        title='设为私人放映室'
        description='私人房间不出现在大厅，需要输入密码才能进入'
        confirmText='设为私人'
        confirmDisabled={visibilityPassword.trim().length < 4}
        loading={visibilityPending}
        onConfirm={() => void handleConfirmPrivate()}
      >
        <Input
          id='room-visibility-password'
          type='password'
          value={visibilityPassword}
          maxLength={32}
          placeholder='请输入密码（至少 4 位）'
          onChange={event => setVisibilityPassword(event.target.value)}
        />
      </FormDialog>

      {/* 修改房间信息 */}
      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title='修改房间信息'
        description='名称与公告会实时同步给房间里的所有人'
        confirmText='保存'
        confirmDisabled={!editName.trim()}
        loading={saving}
        onConfirm={() => void handleSaveRoom()}
      >
        <Input
          id='edit-room-name'
          value={editName}
          maxLength={ROOM_NAME_MAX}
          placeholder='请输入房间名称'
          onChange={e => setEditName(e.target.value)}
        />
        <Textarea
          id='edit-room-announcement'
          value={editAnnouncement}
          maxLength={500}
          rows={3}
          placeholder='请输入房间公告，留空则不显示'
          onChange={e => setEditAnnouncement(e.target.value)}
        />
      </FormDialog>
    </>
  );
};

/** 路由入口：roomId 变化时重建视图（等价于切换房间时重置全部本地状态） */
const RoomPage: React.FC = () => {
  const { roomId = '' } = useParams();
  return (
    <RoomView
      key={roomId}
      roomId={roomId}
    />
  );
};

export default RoomPage;
