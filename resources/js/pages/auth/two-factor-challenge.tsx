import { Head, useForm, router } from '@inertiajs/react';
import { FormEventHandler, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AuthLayout from '@/layouts/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
    email: string;
    password: string;
    remember: boolean;
    method: 'authenticator' | 'email';
    errors?: {
        code?: string;
        recovery_code?: string;
    };
}

type FormData = {
    code: string;
    recovery_code: string;
    email: string;
    password: string;
    remember: boolean;
    remember_device: boolean;
    method: 'authenticator' | 'email';
}

export default function TwoFactorChallenge({ email, password, remember, method, errors: propErrors }: Props) {
    const [activeTab, setActiveTab] = useState<'code' | 'recovery'>('code');
    const [resendCountdown, setResendCountdown] = useState(60);
    const { data, setData, post, processing, errors } = useForm<FormData>({
        code: '',
        recovery_code: '',
        email,
        password,
        remember,
        remember_device: false,
        method,
    });

    // Countdown effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCountdown > 0) {
            timer = setInterval(() => {
                setResendCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCountdown]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', {
            code: data.code,
            recovery_code: data.recovery_code,
            email: data.email,
            remember: data.remember,
            remember_device: data.remember_device,
            method: data.method
        });
        
        post(route('login'), {
            preserveScroll: true,
            onSuccess: (response) => {
                console.log('2FA verification successful. Full response:', response);
                console.log('Attempting to navigate to dashboard...');
                
                // Use window.location for a full page reload to ensure session is properly set
                window.location.href = route('dashboard');
            },
            onError: (errors) => {
                console.error('2FA verification failed:', errors);
                // Clear the code field on error
                if (activeTab === 'code') {
                    setData('code', '');
                } else {
                    setData('recovery_code', '');
                }
            },
            onFinish: () => {
                console.log('2FA verification request completed');
            }
        });
    };

    const handleResendCode = () => {
        if (resendCountdown > 0) return;
        
        console.log('Resending code...');
        post(route('two-factor-challenge.send-code'), {
            method: data.method,
            email: data.email,
            password: data.password,
            remember: data.remember,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                console.log('Code resent successfully');
                setResendCountdown(60); // Reset countdown after successful resend
                toast.success('A new verification code has been sent to your email');
            },
            onError: (errors: Record<string, string>) => {
                console.error('Failed to resend code:', errors);
                toast.error(errors.code || 'Failed to send verification code. Please try again.');
            }
        } as any);
    };

    // Combine prop errors with form errors
    const allErrors = {
        ...errors,
        ...propErrors
    };

    // Check if the code is complete (6 digits) or recovery code is entered
    const isCodeComplete = data.code.length === 6;
    const isRecoveryCodeEntered = data.recovery_code.length > 0;

    return (
        <AuthLayout 
            title="Two Factor Authentication" 
            description="Please enter your authentication code to continue"
        >
            <Head title="Two Factor Authentication" />

            <div className="flex items-center justify-center py-8">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Two Factor Authentication</CardTitle>
                        <CardDescription>
                            {method === 'authenticator' 
                                ? 'Please enter the code from your authenticator app'
                                : 'Please enter the code sent to your email'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'code' | 'recovery')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="code">
                                    {method === 'authenticator' ? 'From Authenticator App' : 'From Email'}
                                </TabsTrigger>
                                <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
                            </TabsList>
                            <TabsContent value="code">
                                <form className="flex flex-col gap-6" onSubmit={submit}>
                                    <div className="grid gap-6">
                                        {allErrors.code && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{allErrors.code}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="flex justify-center">
                                            <InputOTP
                                                maxLength={6}
                                                value={data.code}
                                                onChange={(value) => {
                                                    console.log('OTP value changed:', value);
                                                    setData('code', value);
                                                }}
                                                disabled={processing}
                                                className="gap-2"
                                                containerClassName="justify-center"
                                            >
                                                <InputOTPGroup className="gap-2">
                                                    <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                                                    <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                                                    <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                                                    <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                                                    <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                                                    <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                                                </InputOTPGroup>
                                            </InputOTP>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox 
                                                id="remember_device" 
                                                checked={data.remember_device}
                                                onCheckedChange={(checked) => setData('remember_device', checked as boolean)}
                                            />
                                            <Label htmlFor="remember_device" className="text-sm text-muted-foreground">
                                                Remember this device for 30 days
                                            </Label>
                                        </div>

                                        <Button 
                                            type="submit" 
                                            className="w-full" 
                                            disabled={processing || !isCodeComplete}
                                            size="lg"
                                        >
                                            {processing ? 'Verifying...' : 'Verify'}
                                        </Button>

                                        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                                            {method === 'email' && (
                                                <button
                                                    type="button"
                                                    onClick={handleResendCode}
                                                    disabled={resendCountdown > 0}
                                                    className={`hover:text-primary ${resendCountdown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    {resendCountdown > 0 
                                                        ? `Resend code in ${resendCountdown}s`
                                                        : "Didn't receive a code? Resend"}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('recovery')}
                                                className="hover:text-primary cursor-pointer"
                                            >
                                                Use a recovery code
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </TabsContent>
                            <TabsContent value="recovery">
                                <form className="flex flex-col gap-6" onSubmit={submit}>
                                    <div className="grid gap-6">
                                        {allErrors.recovery_code && (
                                            <Alert variant="destructive">
                                                <AlertDescription>{allErrors.recovery_code}</AlertDescription>
                                            </Alert>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="recovery_code">Recovery Code</Label>
                                            <Input
                                                id="recovery_code"
                                                value={data.recovery_code}
                                                onChange={(e) => setData('recovery_code', e.target.value)}
                                                placeholder="Enter your recovery code"
                                                disabled={processing}
                                            />
                                        </div>

                                        <Button 
                                            type="submit" 
                                            className="w-full" 
                                            disabled={processing || !isRecoveryCodeEntered}
                                            size="lg"
                                        >
                                            {processing ? 'Verifying...' : 'Verify'}
                                        </Button>

                                        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('code')}
                                                className="hover:text-primary"
                                            >
                                                Use authentication code instead
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AuthLayout>
    );
} 