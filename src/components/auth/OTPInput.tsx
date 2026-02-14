import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface OTPInputProps {
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    disabled?: boolean;
}

export function OTPInput({ value, onChange, onComplete, disabled }: OTPInputProps) {
    const handleChange = (newValue: string) => {
        onChange(newValue);
        if (newValue.length === 6 && onComplete) {
            onComplete(newValue);
        }
    };

    return (
        <div className="flex justify-center">
            <InputOTP
                maxLength={6}
                value={value}
                onChange={handleChange}
                disabled={disabled}
            >
                <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                </InputOTPGroup>
            </InputOTP>
        </div>
    );
}
