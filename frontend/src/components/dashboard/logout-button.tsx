"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { secureFetch } from "@/lib/secure-fetch";

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await secureFetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={logout} disabled={loading}>
      <LogOut aria-hidden />
      {loading ? "Saindo…" : "Sair"}
    </Button>
  );
}

export { LogoutButton };
