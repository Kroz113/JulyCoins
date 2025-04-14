import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Submission, Task, Auction, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface AdminStats {
  totalCoins: number;
  totalStudents: number;
  totalTasks: number;
  pendingSubmissions: number;
  activeAuctions: number;
}

interface SubmissionWithTask extends Submission {
  task: Task;
  user?: User;
}

interface AuctionWithBids extends Auction {
  bids: {
    id: number;
    userId: number;
    amount: number;
  }[];
  highestBid?: {
    amount: number;
    userId: number;
  };
  highestBidUser?: User;
}

export default function AdminDashboard() {
  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  // Fetch pending submissions
  const { 
    data: submissions, 
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions
  } = useQuery<SubmissionWithTask[]>({
    queryKey: ["/api/submissions"],
  });

  // Fetch active auctions
  const { 
    data: auctions, 
    isLoading: isLoadingAuctions,
    refetch: refetchAuctions
  } = useQuery<AuctionWithBids[]>({
    queryKey: ["/api/auctions"],
  });

  // Fetch users for displaying names in tables
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Handle approving a submission
  const handleApproveSubmission = async (submissionId: number, taskCoins: number) => {
    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'approved',
          coinsAwarded: taskCoins
        }),
      });
      refetchSubmissions();
    } catch (error) {
      console.error('Error approving submission:', error);
    }
  };

  // Handle rejecting a submission
  const handleRejectSubmission = async (submissionId: number) => {
    try {
      await fetch(`/api/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected'
        }),
      });
      refetchSubmissions();
    } catch (error) {
      console.error('Error rejecting submission:', error);
    }
  };

  // Handle closing an auction
  const handleCloseAuction = async (auctionId: number) => {
    try {
      await fetch(`/api/auctions/${auctionId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      refetchAuctions();
    } catch (error) {
      console.error('Error closing auction:', error);
    }
  };

  // Find user by ID
  const findUser = (userId: number) => {
    return users?.find(user => user.id === userId);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Administrador</h1>
          <p className="text-gray-500">Gestión de JuliCoins y actividades</p>
        </div>

        {/* Stats Overview */}
        {isLoadingStats ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Total JuliCoins en Circulación</h2>
                    <p className="text-2xl font-bold text-gray-800">{stats?.totalCoins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Estudiantes Activos</h2>
                    <p className="text-2xl font-bold text-gray-800">{stats?.totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-sm font-medium text-gray-500">Trabajos Pendientes</h2>
                    <p className="text-2xl font-bold text-gray-800">{stats?.pendingSubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trabajos Recientes */}
        <Card className="mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Trabajos Recientes</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoadingSubmissions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : submissions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay trabajos pendientes
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trabajo</TableHead>
                    <TableHead>Estudiante</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>JuliCoins</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((submission) => {
                    const user = findUser(submission.userId);
                    return (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{submission.task.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {user?.username?.substring(0, 2).toUpperCase() || '??'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{user?.username || 'Usuario desconocido'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {submission.status === 'pending' ? 'Pendiente' : 
                             submission.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {submission.task.coinsReward}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary-600 hover:text-primary-900 mr-1"
                            asChild
                          >
                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </a>
                          </Button>
                          {submission.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-900 mr-1"
                                onClick={() => handleApproveSubmission(submission.id, submission.task.coinsReward)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleRejectSubmission(submission.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Subastas Activas */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800">Subastas Activas</h2>
          </div>
          <div className="overflow-x-auto">
            {isLoadingAuctions ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : auctions?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay subastas activas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Fecha Cierre</TableHead>
                    <TableHead>Participantes</TableHead>
                    <TableHead>Puja Máxima</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auctions?.map((auction) => {
                    const highestBidUser = auction.highestBid ? findUser(auction.highestBid.userId) : undefined;
                    return (
                      <TableRow key={auction.id}>
                        <TableCell>
                          <div className="text-sm font-medium text-gray-900">{auction.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{auction.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(auction.endDate).toLocaleDateString()} - {new Date(auction.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {auction.bids?.length || 0}
                        </TableCell>
                        <TableCell>
                          {auction.highestBid ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {auction.highestBid.amount} JuliCoins
                              </div>
                              <div className="text-xs text-gray-500">
                                por {highestBidUser?.username || 'Usuario desconocido'}
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500">Sin pujas</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary-600 hover:text-primary-900 mr-1"
                          >
                            Ver Detalles
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => auction.highestBid && handleCloseAuction(auction.id)}
                            disabled={!auction.highestBid}
                          >
                            Cerrar Subasta
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
