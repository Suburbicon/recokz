import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

type Props<T extends FieldValues> = {
  label?: string;
  placeholder?: string;
  name: FieldPath<T>;
  options: { label: string; value: string }[];
  defaultValue?: string;
  className?: string;
  disabled?: boolean;
};

export function SelectField<T extends FieldValues>({
  label,
  name,
  placeholder,
  options,
  className,
  disabled,
}: Props<T>) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? (
            <FormLabel className="text-dark-gray">{label}</FormLabel>
          ) : null}
          <FormControl>
            <Select
              disabled={disabled}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (value) {
                  form.trigger(name);
                }
              }}
            >
              <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((item, index) => (
                  <SelectItem key={index} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
