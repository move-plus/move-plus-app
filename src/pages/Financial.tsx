import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, TrendingUp, Calendar } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  status: string;
  payment_date: string | null;
  created_at: string;
  classes: {
    activity: string;
  };
  enrollments: {
    profiles: {
      full_name: string;
    } | null;
  };
}

const Financial = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [yearlyTotal, setYearlyTotal] = useState(0);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!professional) return;

    const { data: paymentsData } = await supabase
      .from("payments")
      .select(
        `
        *,
        classes:class_id (
          activity
        ),
        enrollments:enrollment_id (
          profiles:student_id (
            full_name
          )
        )
      `
      )
      .eq("classes.professional_id", professional.id)
      .order("created_at", { ascending: false });

    if (paymentsData) {
      setPayments(paymentsData as any);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthly = paymentsData
        .filter((p) => {
          const date = new Date(p.created_at);
          return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
          );
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      const yearly = paymentsData
        .filter((p) => {
          const date = new Date(p.created_at);
          return date.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setMonthlyTotal(monthly);
      setYearlyTotal(yearly);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold">Financeiro</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Acompanhe seus ganhos e pagamentos
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total no Mês
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {monthlyTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos recebidos este mês
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total no Ano
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                R$ {yearlyTotal.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Acumulado em {new Date().getFullYear()}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Histórico de Pagamentos</CardTitle>
            <CardDescription>
              Lista completa de todos os pagamentos recebidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Nenhum pagamento registrado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.enrollments?.profiles?.full_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {payment.classes?.activity || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(payment.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === "paid" ? "default" : "secondary"
                          }
                        >
                          {payment.status === "paid" ? "Pago" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.payment_date
                          ? new Date(payment.payment_date).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Financial;
