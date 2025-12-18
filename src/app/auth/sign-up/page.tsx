"use client"
import Google from '@/components/buttons/oauth/google'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
    const { handleSignup, signUpForm, isLoading } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = signUpForm;

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <form
                onSubmit={handleSubmit(handleSignup)}
                className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md dark:[--color-muted:var(--color-zinc-900)]">
                <div className="p-8 pb-6">
                    <div>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Create a S2C Account</h1>
                        <p className="text-sm">Welcome! Create an account to get started</p>
                    </div>

                    <div className="space-y-5 mt-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="firstname"
                                    className="block text-sm">
                                    Firstname
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    id="firstname"
                                    {...register('firstName')}
                                    className={errors.firstName ? "border-destructive" : ""}
                                />
                                {errors.firstName && (
                                    <p className="text-destructive text-xs">
                                        {errors.firstName.message}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="lastname"
                                    className="block text-sm">
                                    Lastname
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    id="lastname"
                                    {...register('lastName')}
                                    className={errors.lastName ? "border-destructive" : ""}
                                />
                                {errors.lastName && (
                                    <p className="text-destructive text-xs">
                                        {errors.lastName.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="email"
                                className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                id="email"
                                {...register('email')}
                                className={errors.email ? "border-destructive" : ""}
                            />
                            {errors.email && (
                                <p className="text-destructive text-xs">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="pwd"
                                className="text-sm">
                                Password
                            </Label>
                            <Input
                                type="password"
                                required
                                id="password"
                                {...register('password')}
                                className={`input sz-md variant-mixed ${errors.password ? "border-destructive" : ""}`}
                            />
                            {errors.password && (
                                <p className="text-destructive text-xs">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {errors.root && (
                            <p className="text-destructive text-xs text-center">
                                {errors.root.message}
                            </p>
                        )}

                        <Button className="w-full"
                        type='submit'
                        disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className='mr-2 h-4 w-4 animate-spin'/>
                                    Creating Account...
                                </>
                            ): (
                                "Continue"
                            )}
                        </Button>

                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                            <hr className="border-dashed" />
                            <span className="text-muted-foreground text-xs">
                                Or continue with
                            </span>
                            <hr className="border-dashed" />
                        </div>

                        <Google />
                    </div>
                </div>

                <div className="bg-muted rounded-(--radius) border p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Have an account ?
                        <Button
                            asChild
                            variant="link"
                            className="px-2">
                            <Link href="#">Sign In</Link>
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    )
}