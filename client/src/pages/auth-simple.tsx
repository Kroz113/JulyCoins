import { useState } from "react";
import { useMinimalAuth } from "@/hooks/use-minimal-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WalletIcon } from "@/components/ui/wallet-icon";

export default function AuthSimplePage() {
  const { user, login, register, isLoading } = useMinimalAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Formulario de login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Formulario de registro
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await login(loginEmail, loginPassword);
    } catch (err) {
      console.error("Login error:", err);
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerUsername || !registerEmail || !registerPassword || !registerPhone) {
      setError("Por favor completa todos los campos");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await register(registerUsername, registerEmail, registerPassword, registerPhone);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Error al registrarse. Inténtalo nuevamente.");
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

          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {isLoginView ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="text"
                  placeholder="correo@ejemplo.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <Input
                  type="text"
                  placeholder="usuario123"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  type="text"
                  placeholder="correo@ejemplo.com"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono
                </label>
                <Input
                  type="text"
                  placeholder="+56 9 1234 5678"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Registrarse"}
              </Button>
            </form>
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