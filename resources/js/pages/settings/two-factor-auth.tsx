import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState, FormEventHandler, useEffect } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import HeadingSmall from '@/components/heading-small';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, Shield, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
    enabled: boolean;
    showingQrCode: boolean;
    showingRecoveryCodes: boolean;
    qrCode: string | null;
    recoveryCodes: string[] | null;
    status?: string;
    error?: string;
    method?: 'authenticator' | 'email';
}

type TwoFactorForm = {
    [key: string]: string;
    code: string;
    method: 'authenticator' | 'email';
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Two Factor Authentication',
        href: '/settings/two-factor-auth',
    },
];

export default function TwoFactorAuth({ enabled, showingQrCode, showingRecoveryCodes, qrCode, recoveryCodes, status, error, method = 'authenticator' }: Props) {
    const [showQrCode, setShowQrCode] = useState(showingQrCode);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(showingRecoveryCodes);
    const [otpValue, setOtpValue] = useState('');
    const [selectedMethod, setSelectedMethod] = useState<'authenticator' | 'email'>(method);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [setupQrCode, setSetupQrCode] = useState<string | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const form = useForm<TwoFactorForm>({
        code: '',
        method: selectedMethod,
    });

    const enable2FA: FormEventHandler = (e) => {
        e.preventDefault();
        setIsSettingUp(true);
        
        // For email method, send the initial code
        if (selectedMethod === 'email') {
            form.post(route('two-factor-auth.enable'), {
                onSuccess: () => {
                    setCountdown(60); // Start 60 second countdown
                },
                onError: (errors) => {
                    if (errors.method) {
                        form.setError('method', errors.method);
                    }
                    setIsSettingUp(false);
                }
            });
        } else {
            // For authenticator, get the QR code first
            form.post(route('two-factor-auth.enable'), {
                onSuccess: (page) => {
                    console.log('Full response:', page);
                    console.log('All props:', page.props);
                    
                    // The QR code should be in the main props
                    const qrCode = page.props.qrCode as string | undefined;
                    if (qrCode) {
                        console.log('Found QR code in props');
                        setSetupQrCode(qrCode);
                    } else {
                        console.error('No QR code found in response:', {
                            props: page.props
                        });
                    }
                },
                onError: (errors) => {
                    console.error('Error enabling 2FA:', errors);
                    if (errors.method) {
                        form.setError('method', errors.method);
                    }
                    setIsSettingUp(false);
                    setSetupQrCode(null);
                }
            });
        }
    };

    const disable2FA: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('two-factor-auth.disable'), {
            onSuccess: () => {
                setIsSettingUp(true);
                setCountdown(60); // Start 60 second countdown
            },
            onError: (errors) => {
                if (errors.code) {
                    form.setError('code', errors.code);
                }
            }
        });
    };

    const confirmDisable2FA: FormEventHandler = (e) => {
        e.preventDefault();
        if (otpValue.length !== 6) {
            return;
        }

        const currentFormData = {
            code: otpValue,
        };
    
        router.post(route('two-factor-auth.confirm-disable'), currentFormData, {
            preserveScroll: true,
            preserveState: true,
            onBefore: () => {
                e.preventDefault();
            },
            onSuccess: (page: any) => {
                // Check if there's an error in the response
                if (page.props.error) {
                    form.setError('code', page.props.error);
                    setOtpValue('');
                    return;
                }

                // Only proceed if there's no error
                form.reset();
                setOtpValue('');
                setIsSettingUp(false);
                setShowQrCode(false);
                setShowRecoveryCodes(false);
                
                // Show success toast
                toast.success('Two-factor authentication has been disabled', {
                    description: 'Your account is now using standard password authentication.',
                    duration: 5000,
                });
            },
            onError: (errors: any) => {
                if (errors.code) {
                    form.setError('code', errors.code);
                }
                setOtpValue('');
            },
        });
    };

    const confirm2FA: FormEventHandler = (e) => {
        e.preventDefault();
        if (otpValue.length !== 6) {
            return;
        }

        const currentFormData = {
            code: otpValue,
            method: selectedMethod
        };
    
        console.log('Current form data:', currentFormData);
        
        // Verify the code
        router.post(route('two-factor-auth.confirm'), currentFormData, {
            preserveScroll: true,
            preserveState: true,
            onBefore: () => {
                // Prevent the default form submission
                e.preventDefault();
            },
            onSuccess: (page: any) => {
                // If we have an error in the response, handle it
                if (page.props.error) {
                    form.setError('code', page.props.error);
                    setOtpValue('');
                    setIsSettingUp(true);
                    if (page.props.qrCode) {
                        setSetupQrCode(page.props.qrCode);
                    }
                    return;
                }

                form.reset();
                setOtpValue('');
                setIsSettingUp(false);
                setSetupQrCode(null);
                // Update recovery codes state if they exist in the response
                if (page.props.recoveryCodes) {
                    setShowRecoveryCodes(true);
                }
                
                // Show success toast
                toast.success('Two-factor authentication has been enabled successfully!', {
                    description: `Your account is now more secure using ${selectedMethod === 'authenticator' ? 'an authenticator app' : 'email verification'}.`,
                    duration: 5000,
                });
            },
            onError: (errors: any) => {
                if (errors.code) {
                    form.setError('code', errors.code);
                }
                // Don't reset the OTP value on error, just clear it
                setOtpValue('');
                // Keep the setup state active
                setIsSettingUp(true);
            },
        });
    };

    const generateRecoveryCodes: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('two-factor-auth.recovery-codes'), {
            onSuccess: () => setShowRecoveryCodes(true),
        });
    };

    const handleMethodChange = (value: string) => {
        const newMethod = value as 'authenticator' | 'email';
        setSelectedMethod(newMethod);
        form.setData('method', newMethod);
        setOtpValue('');
        setShowQrCode(false);
    };

    const resendCode = () => {
        if (countdown > 0) return;
        
        // If we're in disable mode, we need to call the disable endpoint again
        if (enabled) {
            form.post(route('two-factor-auth.disable'), {
                onSuccess: () => {
                    setCountdown(60); // Reset countdown
                }
            });
        } else {
            form.post(route('two-factor-auth.send-code'), {
                onSuccess: () => {
                    setCountdown(60); // Reset countdown
                }
            });
        }
    };

    const renderMethodInfo = () => {
        if (selectedMethod === 'email') {
            return (
                <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        While email 2FA provides security, we recommend using an authenticator app for better protection. 
                        Email 2FA can be vulnerable to email account compromise.
                    </AlertDescription>
                </Alert>
            );
        }
        return null;
    };

    const renderCurrentStatus = () => {
        if (!enabled) return null;

        return (
            <div className="space-y-4">
                <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                        Two-factor authentication is currently enabled using the {method} method.
                    </AlertDescription>
                </Alert>

                <div className="flex space-x-4">
                    <form onSubmit={generateRecoveryCodes}>
                        <Button type="submit" variant="outline" disabled={form.processing}>
                            Regenerate Recovery Codes
                        </Button>
                    </form>
                    <form onSubmit={disable2FA}>
                        <Button type="submit" variant="destructive" disabled={form.processing}>
                            Disable 2FA
                        </Button>
                    </form>
                </div>

                {showRecoveryCodes && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Store these recovery codes in a secure password manager. They can be used to recover access to your account if your two factor authentication device is lost.
                        </p>
                        <div className="p-4 bg-muted rounded-lg">
                            {recoveryCodes && (
                                <div className="grid grid-cols-2 gap-2">
                                    {recoveryCodes.map((code, index) => (
                                        <div key={index} className="font-mono text-sm">
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderSetupForm = () => {
        if (!isSettingUp) return null;

        return (
            <div className="space-y-4">
                {selectedMethod === 'authenticator' && !enabled && (
                    <div className="space-y-4">
                        {setupQrCode ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    Scan the following QR code using your phone's authenticator application.
                                </p>
                                <div className="p-4 bg-white rounded-lg flex justify-center items-center">
                                    <div dangerouslySetInnerHTML={{ __html: setupQrCode }} />
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Loading QR code...
                            </p>
                        )}
                    </div>
                )}

                {(selectedMethod === 'email' || enabled) && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {enabled 
                                ? "We've sent a verification code to your email address to confirm disabling 2FA."
                                : "We've sent a verification code to your email address."}
                        </p>
                        <div className="flex items-center gap-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={resendCode}
                                disabled={form.processing || countdown > 0}
                            >
                                Resend Code
                            </Button>
                            {countdown > 0 && (
                                <span className="text-sm text-muted-foreground">
                                    Resend available in {countdown} seconds
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {enabled 
                            ? "Enter the verification code from your email to disable two-factor authentication:"
                            : `Enter the code from your ${selectedMethod === 'authenticator' ? 'authenticator app' : 'email'} to confirm setup:`}
                    </p>

                    {form.errors.code && (
                        <Alert variant="destructive">
                            <AlertDescription>{form.errors.code}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={enabled ? confirmDisable2FA : confirm2FA} className="space-y-4 flex flex-col items-center">
                        <InputOTP
                            maxLength={6}
                            value={otpValue}
                            onChange={setOtpValue}
                            disabled={form.processing}
                            className="gap-2"
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
                        <Button type="submit" disabled={form.processing || otpValue.length !== 6}>
                            {enabled ? 'Disable' : 'Confirm'}
                        </Button>
                    </form>
                </div>
            </div>
        );
    };

    const renderMethodSelection = () => {
        if (enabled || isSettingUp) return null;

        return (
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    When two factor authentication is enabled, you will be prompted for a secure, random token during authentication.
                    You can choose between using an authenticator app or receiving codes via email.
                </p>

                <RadioGroup 
                    value={selectedMethod} 
                    onValueChange={handleMethodChange}
                    className="grid grid-cols-2 gap-4 mb-4"
                >
                    <div>
                        <RadioGroupItem
                            value="authenticator"
                            id="authenticator"
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor="authenticator"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <Smartphone className="mb-3 h-6 w-6" />
                            Authenticator App
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem
                            value="email"
                            id="email"
                            className="peer sr-only"
                        />
                        <Label
                            htmlFor="email"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                        >
                            <Mail className="mb-3 h-6 w-6" />
                            Email
                        </Label>
                    </div>
                </RadioGroup>

                {renderMethodInfo()}

                <form onSubmit={enable2FA} className="flex justify-center">
                    <Button type="submit" disabled={form.processing}>
                        Enable Two-Factor Authentication
                    </Button>
                </form>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Two Factor Authentication" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Two Factor Authentication" 
                        description="Add additional security to your account using two factor authentication."
                    />

                    <Card>

                        <CardContent>
                            {status && (
                                <Alert className="mb-4">
                                    <AlertDescription>{status}</AlertDescription>
                                </Alert>
                            )}

                            {renderCurrentStatus()}
                            {renderSetupForm()}
                            {renderMethodSelection()}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 