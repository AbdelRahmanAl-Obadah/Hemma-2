import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthSplitLayout from '@/layouts/auth/auth-split-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';

type Props = {
    status?: string;
    canRegister: boolean;
};

export default function Login({ status, canRegister }: Props) {
    return (
        <>
            <Head title="تسجيل الدخول" />

            {status && (
                <div
                    role="alert"
                    className="mb-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-center text-sm font-medium text-primary"
                    dir="rtl"
                >
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <fieldset className="space-y-4" dir="rtl">
                            <legend className="flex w-full items-center gap-3 pb-1 text-xs font-semibold tracking-widest text-primary uppercase">
                                <span>بيانات الدخول</span>
                                <span className="h-px flex-1 bg-border" />
                            </legend>

                            <div className="grid gap-1.5">
                                <Label htmlFor="username">اسم المستخدم</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    name="username"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="username"
                                    placeholder="مثال: eyad_aljarrah"
                                    className="text-right"
                                    aria-describedby={errors.username ? 'username-error' : undefined}
                                />
                                <InputError id="username-error" message={errors.username} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    className="text-right"
                                    aria-describedby={errors.password ? 'password-error' : undefined}
                                />
                                <InputError id="password-error" message={errors.password} />
                            </div>

                            <div className="flex items-center gap-2.5" dir="rtl">
                                <Checkbox id="remember" name="remember" tabIndex={3} />
                                <Label htmlFor="remember" className="cursor-pointer font-normal">
                                    تذكّرني
                                </Label>
                            </div>
                        </fieldset>

                        <Button
                            type="submit"
                            className="w-full py-5 text-base font-semibold"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            تسجيل الدخول
                        </Button>

                        {canRegister && (
                            <p className="text-center text-sm text-muted-foreground" dir="rtl">
                                ليس لديك حساب؟{' '}
                                <TextLink href={register()} tabIndex={5}>
                                    إنشاء حساب
                                </TextLink>
                            </p>
                        )}
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = (page: React.ReactNode) => (
    <AuthSplitLayout title="مرحباً بعودتك" description="أدخل بياناتك لتسجيل الدخول إلى حسابك">
        {page}
    </AuthSplitLayout>
);