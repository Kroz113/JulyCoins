import { useState } from "react";
import { useMinimalAuth } from "@/hooks/use-minimal-auth";
import { Redirect } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { WalletIcon } from "@/components/ui/wallet-icon";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const registerSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  phone: z.string().min(9, "El número de teléfono debe tener al menos 9 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, login, register, isLoading } = useMinimalAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      phone: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    try {
      setIsSubmitting(true);
      await register(data.username, data.email, data.password, data.phone);
    } catch (err) {
      console.error("Registration error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-600 to-primary-700 p-4">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Column - Form */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-8">
            <WalletIcon size="lg" className="mx-auto" />
            <h1 className="text-3xl font-bold text-primary-600 mt-4">JuliCoins</h1>
            <p className="text-gray-500 mt-2">Sistema de Monedas Virtuales</p>
          </div>

          {isLoginView ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="correo@ejemplo.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario123"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="correo@ejemplo.com"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+56 9 1234 5678"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Registrando..." : "Registrarse"}
                </Button>
              </form>
            </Form>
          )}

          <div className="mt-6 text-center">
            <button 
              type="button"
              className="text-primary-600 text-sm hover:underline"
              onClick={() => setIsLoginView(!isLoginView)}
            >
              {isLoginView 
                ? "¿No tienes una cuenta? Regístrate aquí"
                : "¿Ya tienes una cuenta? Inicia sesión"}
            </button>
          </div>
        </div>
        
        {/* Right Column - Information */}
        <div className="w-full md:w-1/2 bg-primary-50 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Bienvenido a JuliCoins</h2>
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 text-xs font-bold">1</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Gana JuliCoins</h3>
                <p className="text-sm text-gray-500">Completa trabajos asignados y recibe monedas virtuales como recompensa.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 text-xs font-bold">2</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Sigue tu Progreso</h3>
                <p className="text-sm text-gray-500">Visualiza tu historial de ganancias y gastos en un dashboard intuitivo.</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 text-xs font-bold">3</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Participa en Subastas</h3>
                <p className="text-sm text-gray-500">Utiliza tus JuliCoins para pujar por premios y beneficios especiales.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
