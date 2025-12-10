import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "professional" | "student" | null;

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  fetchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRole = async () => {
      // Verifica se é estudante
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (student) {
        setRole("student");
        return;
      }

     // Verifica se é profissional
      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (professional) {
        setRole("professional");
        return;
      }

     // Fallback: ler role direto da tabela profiles (coluna role)
      // const { data: profile } = await supabase
      //   .from("profiles")
      //   .select("role")
      //   .eq("id", user.id)
      //   .maybeSingle();

      // if (profile?.role) {
      //   const mapped: UserRole =
      //     profile.role === "instructor" ? "professional" : (profile.role as UserRole);
      //   setRole(mapped);
      //   return;
      // }
    };

  useEffect(() => {
    if (!user) {
      setRole(null);
      return;
    }

    fetchRole();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, fetchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
