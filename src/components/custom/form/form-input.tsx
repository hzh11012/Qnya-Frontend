import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Control, FieldValues, Path } from 'react-hook-form';

interface FormInputProps<TFieldValues extends FieldValues = FieldValues> {
  control: Control<TFieldValues>;
  name: Path<TFieldValues>;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  prefixIcon?: React.ReactNode;
  onFocus?: () => void;
}

const FormInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder = '请输入',
  maxLength,
  prefixIcon,
  onFocus
}: FormInputProps<TFieldValues>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label && <FormLabel className='text-sm w-fit'>{label}</FormLabel>}
          <FormControl>
            <Input
              type='text'
              autoComplete='off'
              value={field.value}
              maxLength={maxLength}
              onChange={field.onChange}
              placeholder={placeholder}
              prefixIcon={prefixIcon}
              onFocus={onFocus}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default FormInput;
