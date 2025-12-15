import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
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
      navigate("/login");
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-24">
      <PageHeader title="Financeiro" />
      <div className="container max-w-4xl mx-auto px-4 py-6">

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-[#5F94E2] to-[#2D7DD2] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total no Mês</p>
              <Calendar className="h-5 w-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">R$ {monthlyTotal.toFixed(2)}</p>
            <p className="text-xs opacity-75 mt-1">
              Pagamentos recebidos este mês
            </p>
          </div>

          <div className="bg-gradient-to-br from-[#25C588] to-[#1ea872] rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Total no Ano</p>
              <TrendingUp className="h-5 w-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">R$ {yearlyTotal.toFixed(2)}</p>
            <p className="text-xs opacity-75 mt-1">
              Acumulado em {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-[#1756AC] mb-2">Histórico de Pagamentos</h3>
          <p className="text-sm text-gray-600 mb-6">
            Lista completa de todos os pagamentos recebidos
          </p>
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
        </div>
      </div>
    </div>
  );
};

export default Financial;
