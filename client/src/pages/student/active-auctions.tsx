import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/layouts/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Clock } from "lucide-react";
import { AuctionWithBids } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ActiveAuctions() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Bid amounts for each auction
  const [bidAmounts, setBidAmounts] = useState<Record<number, number>>({});

  // Fetch active auctions
  const { data: auctions, isLoading } = useQuery<AuctionWithBids[]>({
    queryKey: ["/api/auctions"],
  });

  // Bid mutation
  const bidMutation = useMutation({
    mutationFn: async ({ auctionId, amount }: { auctionId: number, amount: number }) => {
      const res = await apiRequest("POST", "/api/bids", { auctionId, amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auctions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Puja realizada",
        description: "Tu puja ha sido registrada correctamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle bid submission
  const handleBid = (auctionId: number) => {
    const amount = bidAmounts[auctionId];
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "Debes ingresar una cantidad válida.",
        variant: "destructive",
      });
      return;
    }

    bidMutation.mutate({ auctionId, amount });
    
    // Clear the input field after submission
    setBidAmounts(prev => ({
      ...prev,
      [auctionId]: 0
    }));
  };

  // Handle input change
  const handleBidAmountChange = (auctionId: number, value: string) => {
    const amount = parseInt(value) || 0;
    setBidAmounts(prev => ({
      ...prev,
      [auctionId]: amount
    }));
  };

  // Check if an auction has ended
  const isAuctionEnded = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Calculate time remaining for auction
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    if (end < now) {
      return "Finalizada";
    }
    
    return formatDistanceToNow(end, { addSuffix: false, locale: es });
  };

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Subastas Activas</h1>
          <p className="text-gray-500">Usa tus JuliCoins para pujar por premios especiales</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : auctions?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay subastas activas</h3>
            <p className="text-gray-500">Vuelve más tarde para ver nuevas subastas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {auctions?.map((auction) => (
              <Card key={auction.id}>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {isAuctionEnded(auction.endDate) ? "Finalizada" : "Activa"}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-2">{auction.title}</h2>
                  <p className="text-gray-600 text-sm mb-4">{auction.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {isAuctionEnded(auction.endDate) ? (
                        <span>Finalizada</span>
                      ) : (
                        <>Cierra en: {getTimeRemaining(auction.endDate)}</>
                      )}
                    </div>
                    <div>{auction.bids?.length || 0} participantes</div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500">Puja más alta:</span>
                      <span className="font-bold text-gray-900">
                        {auction.highestBid ? `${auction.highestBid.amount} JuliCoins` : 'Sin pujas'}
                      </span>
                    </div>
                    {auction.highestBid && (
                      <div className="text-xs text-gray-500">
                        {auction.userBid?.userId === auction.highestBid.userId ? (
                          <span className="text-green-600 font-medium">¡Tienes la puja más alta!</span>
                        ) : (
                          <span>por otro participante</span>
                        )}
                      </div>
                    )}
                  </div>

                  {auction.userBid && (
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">Tu puja actual:</span>
                        <span className="font-bold text-blue-700">{auction.userBid.amount} JuliCoins</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {isAuctionEnded(auction.endDate) ? (
                      <div className="text-center text-gray-500">
                        Esta subasta ha finalizado
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <Input 
                            type="number"
                            placeholder={`Mínimo ${auction.minimumBid} JuliCoins`}
                            value={bidAmounts[auction.id] || ""}
                            onChange={(e) => handleBidAmountChange(auction.id, e.target.value)}
                            min={auction.highestBid ? auction.highestBid.amount + 1 : auction.minimumBid}
                            disabled={bidMutation.isPending}
                          />
                        </div>
                        <Button 
                          onClick={() => handleBid(auction.id)}
                          disabled={
                            bidMutation.isPending || 
                            !bidAmounts[auction.id] ||
                            (auction.highestBid && bidAmounts[auction.id] <= auction.highestBid.amount) ||
                            bidAmounts[auction.id] < auction.minimumBid ||
                            (user && bidAmounts[auction.id] > user.balance)
                          }
                        >
                          {bidMutation.isPending ? "Pujando..." : "Pujar"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
