import request from '@/lib/request';
import type { ApiQuery, ApiResult } from './openapi';

/**
 * 放映室 HTTP 接口（wire 类型来自后端 OpenAPI 文档）
 *
 * 后端改版后，建房、加入、离开、踢人、改信息、播放控制、聊天全部走 Socket
 * （见 watch-room-socket.ts），HTTP 只保留查询，别再往这里加写接口。
 */

/** 公开房间列表条目 */
export type WatchRoomListItem = ApiResult<
  '/api/client/watch-room/',
  'get'
>['items'][number];

/** 房间详情 */
export type WatchRoomDetail = ApiResult<
  '/api/client/watch-room/{roomId}',
  'get'
>;

/** 房间完整状态（成员视角；/current 与 Socket 的 room:state 同结构） */
export type WatchRoomState = NonNullable<
  ApiResult<'/api/client/watch-room/current', 'get'>
>;

/** 房间成员 */
export type WatchRoomMember = WatchRoomState['members'][number];

/** 房间消息（聊天 + 系统通知统一结构） */
export type WatchRoomMessage = ApiResult<
  '/api/client/watch-room/{roomId}/messages',
  'get'
>['items'][number];

/** 当前用户所在房间（断线重连 / 回到房间入口） */
export type MyCurrentRoom = ApiResult<'/api/client/watch-room/current', 'get'>;

/** 权威播放状态 */
export type PlaybackSync = WatchRoomDetail['playback'];

const getPublicRooms = (params: ApiQuery<'/api/client/watch-room/', 'get'>) => {
  return request.get<ApiResult<'/api/client/watch-room/', 'get'>>(
    '/api/client/watch-room',
    { params }
  );
};

const getRoomMessages = (
  roomId: string,
  params: ApiQuery<'/api/client/watch-room/{roomId}/messages', 'get'>
) => {
  return request.get<
    ApiResult<'/api/client/watch-room/{roomId}/messages', 'get'>
  >(`/api/client/watch-room/${roomId}/messages`, { params });
};

const getMyCurrentRoom = () => {
  return request.get<MyCurrentRoom>('/api/client/watch-room/current');
};

export { getPublicRooms, getRoomMessages, getMyCurrentRoom };
