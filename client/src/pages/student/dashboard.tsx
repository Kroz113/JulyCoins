import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { WalletIcon } from "@/components/ui/wallet-icon";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Transaction } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface StudentStats {
  balance: number;
  completedTasks: number;
  totalEarned: number;
  auctionWins: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  
  // Fetch student stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
  });

  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Calculate the inflation rate (just a static value for now)
  const inflationRate = 1.2;

  if (isLoadingStats) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Get auction wins from transactions
  const auctionWins = transactions?.filter(tx => tx.type === "auction_payment") || [];

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Mi Cartera JuliCoins</h1>
          <p className="text-gray-500">Gestiona tus monedas virtuales y actividades</p>
        </div>

        {/* Wallet Overview */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-primary-100 p-4 rounded-full">
                  <WalletIcon size="lg" />
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Balance Actual</h2>
                  <p className="text-3xl font-bold text-gray-800">{user?.balance || 0} JuliCoins</p>
                </div>
              </div>
              <div className="flex flex-col md:items-end">
                <div className="text-sm text-gray-500 mb-1">Valor Actual (ajustado por inflación)</div>
                <div className="text-xl font-semibold text-gray-800">1 JuliCoin = {inflationRate} puntos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Trabajos Completados</h2>
                  <p className="text-2xl font-bold text-gray-800">{stats?.completedTasks || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Ganado</h2>
                  <p className="text-2xl font-bold text-gray-800">{stats?.totalEarned || 0} JuliCoins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Subastas Ganadas</h2>
                  <p className="text-2xl font-bold text-gray-800">{stats?.auctionWins || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Movimientos Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : transactions?.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No tienes movimientos recientes
              </div>
            ) : (
              transactions?.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.amount > 0
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        {transaction.amount > 0 
                          ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          : <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                        }
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className={`font-medium ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                    {transaction.amount > 0 ? "+" : ""}{transaction.amount} JuliCoins
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Auction Wins */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Premios Ganados en Subastas</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : auctionWins.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Aún no has ganado ninguna subasta
              </div>
            ) : (
              auctionWins.map((win) => (
                <div key={win.id} className="px-6 py-4">
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                      <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                    </svg>
                    <h3 className="font-medium text-gray-900">{win.description}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">
                    Ganado el {new Date(win.createdAt).toLocaleDateString()} por {Math.abs(win.amount)} JuliCoins
                  </p>
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Canjeado
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
