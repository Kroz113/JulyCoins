import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Transaction, Submission, Auction } from "@shared/schema";

// Extended transaction with related task or auction
interface TransactionWithDetails extends Transaction {
  task?: {
    id: number;
    title: string;
  };
  auction?: {
    id: number;
    title: string;
  };
}

export default function History() {
  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Fetch submissions
  const { data: submissions, isLoading: isLoadingSubmissions } = useQuery<Submission[]>({
    queryKey: ["/api/submissions"],
  });

  if (isLoadingTransactions || isLoadingSubmissions) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Group transactions by type
  const taskRewards = transactions?.filter(tx => tx.type === "task_reward") || [];
  const auctionPayments = transactions?.filter(tx => tx.type === "auction_payment") || [];

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Historial</h1>
          <p className="text-gray-500">Revisa tu historial de transacciones y actividades</p>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList className="mb-6">
            <TabsTrigger value="transactions">Movimientos</TabsTrigger>
            <TabsTrigger value="submissions">Trabajos Enviados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="transactions">
            <Card>
              <CardContent className="p-0">
                {transactions?.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No tienes movimientos registrados
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.createdAt).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.amount > 0 ? "success" : "destructive"}>
                              {transaction.type === "task_reward" && "Recompensa"}
                              {transaction.type === "auction_payment" && "Subasta"}
                            </Badge>
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                              {transaction.amount > 0 ? "+" : ""}{transaction.amount} JuliCoins
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="submissions">
            <Card>
              <CardContent className="p-0">
                {submissions?.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No has enviado ningún trabajo
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Fecha de Envío</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">JuliCoins</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions?.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="font-medium">{submission.title}</div>
                          </TableCell>
                          <TableCell>
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {submission.status === "pending" && (
                              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                Pendiente
                              </Badge>
                            )}
                            {submission.status === "approved" && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                Aprobado
                              </Badge>
                            )}
                            {submission.status === "rejected" && (
                              <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                                Rechazado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {submission.status === "approved" && submission.coinsAwarded ? (
                              <span className="font-medium text-green-600">{submission.coinsAwarded}</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
