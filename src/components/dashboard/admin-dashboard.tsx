"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  FileText,
  Gift,
  LoaderCircle,
  Megaphone,
  Paperclip,
  PencilLine,
  Plus,
  Save,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  ManagedEvent,
  ManagedNotice,
  ManagedPartner,
  PublicUser,
  SiteSettings,
} from "@/lib/snct-types";

type AdminDashboardProps = {
  users: PublicUser[];
  events: ManagedEvent[];
  notices: ManagedNotice[];
  partners: ManagedPartner[];
  settings: SiteSettings;
};

function formValues(form: HTMLFormElement) {
  return Object.fromEntries(new FormData(form).entries());
}

function AdminDashboard({
  users,
  events,
  notices,
  partners,
  settings,
}: AdminDashboardProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState("");

  async function mutate(
    payload: Record<string, unknown>,
    successMessage: string,
  ) {
    const actionKey = `${payload.action}-${payload.id ?? payload.userId ?? "new"}`;
    setBusyAction(actionKey);
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      toast.error(result.error ?? "Não foi possível salvar a alteração.");
    else {
      toast.success(successMessage);
      router.refresh();
    }
    setBusyAction("");
    return response.ok;
  }

  async function mutateForm(payload: FormData, successMessage: string) {
    const id = String(payload.get("id") ?? "new");
    setBusyAction(`saveNotice-${id}`);
    const response = await fetch("/api/admin", {
      method: "POST",
      body: payload,
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok)
      toast.error(result.error ?? "Não foi possível salvar o edital.");
    else {
      toast.success(successMessage);
      router.refresh();
    }
    setBusyAction("");
    return response.ok;
  }

  const visitors = users.filter((user) => user.role === "visitor");
  const staff = users.filter((user) => user.role === "staff");
  const checkins = visitors.filter((user) => user.checkedInAt).length;
  const gifts = visitors.filter((user) => user.giftDeliveredAt).length;

  return (
    <div>
      <div className="max-w-4xl">
        <p className="font-display text-sm tracking-[.2em] text-magenta-neon uppercase">
          Painel no-code
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl">
          Gestão da SNCT Paulista
        </h1>
        <p className="mt-4 leading-7 text-blue-gray">
          Gerencie equipe, visitantes e conteúdo visual por formulários. As
          mudanças em eventos, parceiros e Hero aparecem no portal.
        </p>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Visitantes",
            value: visitors.length,
            icon: UserRound,
            color: "text-cyan-electric bg-cyan-electric/10",
          },
          {
            label: "Equipe Staff",
            value: staff.length,
            icon: UsersRound,
            color: "text-[#BDA5FF] bg-purple-vibrant/15",
          },
          {
            label: "Check-ins",
            value: checkins,
            icon: ScanLine,
            color: "text-emerald-300 bg-emerald-400/10",
          },
          {
            label: "Brindes",
            value: gifts,
            icon: Gift,
            color: "text-[#FF9AE8] bg-magenta-neon/10",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} size="sm">
            <CardContent className="flex items-center gap-4">
              <span
                className={`grid size-11 place-items-center rounded-xl ${color}`}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <strong className="font-display text-2xl text-ice-white">
                  {value}
                </strong>
                <p className="text-xs text-blue-gray">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="site" className="mt-9">
        <TabsList
          variant="line"
          className="max-w-full justify-start overflow-x-auto pb-2"
        >
          <TabsTrigger value="site">
            <PencilLine aria-hidden /> Portal
          </TabsTrigger>
          <TabsTrigger value="users">
            <UsersRound aria-hidden /> Usuários
          </TabsTrigger>
          <TabsTrigger value="events">
            <CalendarDays aria-hidden /> Eventos
          </TabsTrigger>
          <TabsTrigger value="notices">
            <Megaphone aria-hidden /> Editais
          </TabsTrigger>
          <TabsTrigger value="partners">
            <ShieldCheck aria-hidden /> Parceiros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site" className="pt-7">
          <Card className="border-purple-vibrant/20">
            <CardHeader>
              <CardTitle>Identidade da Hero</CardTitle>
              <p className="text-sm leading-6 text-blue-gray">
                Altere a assinatura da edição e a imagem principal sem editar o
                código.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-5 lg:grid-cols-[1fr_1.35fr_auto] lg:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  const values = formValues(event.currentTarget);
                  void mutate(
                    { action: "updateSettings", ...values },
                    "Hero atualizada com sucesso.",
                  );
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="eventEdition">Nome/ano da edição</Label>
                  <Input
                    id="eventEdition"
                    name="eventEdition"
                    defaultValue={settings.eventEdition}
                    placeholder="Paulista 2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroImageUrl">Imagem ou URL da Hero</Label>
                  <Input
                    id="heroImageUrl"
                    name="heroImageUrl"
                    defaultValue={settings.heroImageUrl}
                    placeholder="/images/logo.png ou https://..."
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busyAction.startsWith("updateSettings")}
                >
                  <Save aria-hidden /> Salvar
                </Button>
              </form>
              <div className="mt-6 flex min-h-44 items-center justify-center overflow-hidden rounded-2xl border border-cyan-electric/15 bg-[radial-gradient(circle_at_center,rgb(106_0_255/25%),transparent_65%)] p-5">
                <img
                  src={settings.heroImageUrl}
                  alt="Prévia atual da Hero"
                  className="max-h-48 max-w-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="pt-7">
          <div className="grid gap-5 xl:grid-cols-[.85fr_1.15fr]">
            <Card className="h-fit border-cyan-electric/20">
              <CardHeader>
                <CardTitle>Criar usuário</CardTitle>
                <p className="text-sm leading-6 text-blue-gray">
                  Cadastre visitantes ou delegue acesso à equipe Staff.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const values = formValues(event.currentTarget);
                    const success = await mutate(
                      { action: "createUser", ...values },
                      "Usuário criado.",
                    );
                    if (success) event.currentTarget.reset();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="new-user-name">Nome</Label>
                    <Input id="new-user-name" name="name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">E-mail</Label>
                    <Input
                      id="new-user-email"
                      name="email"
                      type="email"
                      required
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-user-role">Perfil</Label>
                      <select
                        id="new-user-role"
                        name="role"
                        defaultValue="staff"
                        className="h-11 w-full rounded-xl border border-input bg-[#111329] px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <option value="staff">Staff</option>
                        <option value="visitor">Visitante</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-user-age">Idade (visitante)</Label>
                      <Input
                        id="new-user-age"
                        name="age"
                        type="number"
                        min={5}
                        max={120}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-password">Senha temporária</Label>
                    <Input
                      id="new-user-password"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busyAction.startsWith("createUser")}
                  >
                    <Plus aria-hidden /> Criar usuário
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuários cadastrados</CardTitle>
                <p className="text-sm text-blue-gray">
                  {users.length} conta(s) além do administrador principal.
                </p>
              </CardHeader>
              <CardContent>
                {users.length ? (
                  <ul className="divide-y divide-white/10">
                    {users.map((user) => (
                      <li
                        key={user.id}
                        className="flex flex-col gap-3 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ice-white">
                              {user.name}
                            </p>
                            <Badge
                              variant="outline"
                              className={
                                user.role === "staff"
                                  ? "border-purple-vibrant/30 bg-purple-vibrant/10 text-[#BDA5FF]"
                                  : "border-cyan-electric/30 bg-cyan-electric/10 text-cyan-electric"
                              }
                            >
                              {user.role === "staff" ? "Staff" : "Visitante"}
                            </Badge>
                            {user.checkedInAt ? (
                              <Badge className="bg-emerald-500/15 text-emerald-300">
                                Check-in
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 truncate text-sm text-blue-gray">
                            {user.email}
                            {user.age ? ` · ${user.age} anos` : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyAction === `deleteUser-${user.id}`}
                          onClick={() => {
                            if (window.confirm(`Excluir ${user.name}?`))
                              void mutate(
                                { action: "deleteUser", userId: user.id },
                                "Usuário excluído.",
                              );
                          }}
                        >
                          <Trash2 aria-hidden /> Excluir
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-blue-gray">
                    Nenhum usuário cadastrado ainda.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="pt-7">
          <Card className="border-magenta-neon/15">
            <CardHeader>
              <CardTitle>Adicionar próximo evento</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-[.7fr_.7fr_1.6fr_1.2fr_auto] md:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const success = await mutate(
                    { action: "saveEvent", ...formValues(event.currentTarget) },
                    "Evento adicionado.",
                  );
                  if (success) event.currentTarget.reset();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="new-event-date">Data</Label>
                  <Input
                    id="new-event-date"
                    name="date"
                    placeholder="24/10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-event-time">Hora</Label>
                  <Input
                    id="new-event-time"
                    name="time"
                    placeholder="09:00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-event-title">Evento</Label>
                  <Input id="new-event-title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-event-location">Local</Label>
                  <Input id="new-event-location" name="location" required />
                </div>
                <Button type="submit">
                  <Plus aria-hidden /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-5 grid gap-4">
            {events.map((event) => (
              <Card key={event.id} size="sm">
                <CardContent>
                  <form
                    className="grid gap-3 md:grid-cols-[.65fr_.65fr_1.5fr_1.15fr_auto] md:items-end"
                    onSubmit={(formEvent) => {
                      formEvent.preventDefault();
                      void mutate(
                        {
                          action: "saveEvent",
                          id: event.id,
                          ...formValues(formEvent.currentTarget),
                        },
                        "Evento atualizado.",
                      );
                    }}
                  >
                    <div className="space-y-1.5">
                      <Label htmlFor={`${event.id}-date`}>Data</Label>
                      <Input
                        id={`${event.id}-date`}
                        name="date"
                        defaultValue={event.date}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${event.id}-time`}>Hora</Label>
                      <Input
                        id={`${event.id}-time`}
                        name="time"
                        defaultValue={event.time}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${event.id}-title`}>Título</Label>
                      <Input
                        id={`${event.id}-title`}
                        name="title"
                        defaultValue={event.title}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${event.id}-location`}>Local</Label>
                      <Input
                        id={`${event.id}-location`}
                        name="location"
                        defaultValue={event.location}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="icon"
                        aria-label={`Salvar ${event.title}`}
                      >
                        <Save aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        aria-label={`Excluir ${event.title}`}
                        onClick={() => {
                          if (
                            window.confirm(`Excluir o evento “${event.title}”?`)
                          )
                            void mutate(
                              { action: "deleteEvent", id: event.id },
                              "Evento excluído.",
                            );
                        }}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notices" className="pt-7">
          <Card className="border-cyan-electric/20">
            <CardHeader>
              <CardTitle>Novo edital</CardTitle>
              <p className="text-sm leading-6 text-blue-gray">
                Publique o edital e anexe documentos em PDF, DOC, DOCX, ODT, XLS
                ou XLSX de até 10 MB.
              </p>
            </CardHeader>
            <CardContent>
              <form
                encType="multipart/form-data"
                className="grid gap-4 lg:grid-cols-[1.5fr_1fr_.7fr_1.2fr_auto] lg:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const success = await mutateForm(
                    new FormData(event.currentTarget),
                    "Edital publicado.",
                  );
                  if (success) event.currentTarget.reset();
                }}
              >
                <input type="hidden" name="action" value="saveNotice" />
                <div className="space-y-2">
                  <Label htmlFor="new-notice-title">Título</Label>
                  <Input id="new-notice-title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-notice-registration">Inscrições</Label>
                  <Input
                    id="new-notice-registration"
                    name="registration"
                    placeholder="06/11–26/11/2026"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-notice-status">Status</Label>
                  <select
                    id="new-notice-status"
                    name="status"
                    defaultValue="aberto"
                    className="h-11 w-full rounded-xl border border-input bg-[#111329] px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    <option value="aberto">Aberto</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-notice-document">Documento</Label>
                  <Input
                    id="new-notice-document"
                    name="document"
                    type="file"
                    accept=".pdf,.doc,.docx,.odt,.xls,.xlsx"
                    className="pt-1.5"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busyAction === "saveNotice-new"}
                >
                  <Plus aria-hidden /> Publicar
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-5 grid gap-4">
            {notices.map((notice) => (
              <Card key={notice.id} size="sm">
                <CardContent>
                  <form
                    encType="multipart/form-data"
                    className="grid gap-4 lg:grid-cols-[1.5fr_1fr_.7fr_1.2fr_auto] lg:items-end"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void mutateForm(
                        new FormData(event.currentTarget),
                        "Edital atualizado.",
                      );
                    }}
                  >
                    <input type="hidden" name="action" value="saveNotice" />
                    <input type="hidden" name="id" value={notice.id} />
                    <div className="space-y-1.5">
                      <Label htmlFor={`${notice.id}-title`}>Título</Label>
                      <Input
                        id={`${notice.id}-title`}
                        name="title"
                        defaultValue={notice.title}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${notice.id}-registration`}>
                        Inscrições
                      </Label>
                      <Input
                        id={`${notice.id}-registration`}
                        name="registration"
                        defaultValue={notice.registration}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${notice.id}-status`}>Status</Label>
                      <select
                        id={`${notice.id}-status`}
                        name="status"
                        defaultValue={notice.status}
                        className="h-11 w-full rounded-xl border border-input bg-[#111329] px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                      >
                        <option value="aberto">Aberto</option>
                        <option value="encerrado">Encerrado</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${notice.id}-document`}>
                        Anexar outro documento
                      </Label>
                      <Input
                        id={`${notice.id}-document`}
                        name="document"
                        type="file"
                        accept=".pdf,.doc,.docx,.odt,.xls,.xlsx"
                        className="pt-1.5"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="icon"
                        aria-label={`Salvar ${notice.title}`}
                        disabled={busyAction === `saveNotice-${notice.id}`}
                      >
                        <Save aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        aria-label={`Excluir ${notice.title}`}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Excluir o edital “${notice.title}”?`,
                            )
                          )
                            void mutate(
                              { action: "deleteNotice", id: notice.id },
                              "Edital excluído.",
                            );
                        }}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </form>

                  {notice.documents.length ? (
                    <ul className="mt-5 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
                      {notice.documents.map((document) => (
                        <li
                          key={document.id}
                          className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3"
                        >
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-electric/10 text-cyan-electric">
                            <FileText className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0 flex-1">
                            <a
                              href={`/api/documents/${document.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="block truncate text-sm font-semibold text-ice-white underline-offset-4 hover:text-cyan-electric hover:underline"
                            >
                              {document.name}
                            </a>
                            <p className="text-xs text-blue-gray">
                              {(document.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="destructive"
                            aria-label={`Remover documento ${document.name}`}
                            onClick={() => {
                              if (window.confirm(`Remover “${document.name}”?`))
                                void mutate(
                                  {
                                    action: "deleteNoticeDocument",
                                    noticeId: notice.id,
                                    documentId: document.id,
                                  },
                                  "Documento removido.",
                                );
                            }}
                          >
                            <Trash2 aria-hidden />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-blue-gray">
                      <Paperclip className="size-4" aria-hidden /> Nenhum
                      documento anexado.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="partners" className="pt-7">
          <Card className="border-cyan-electric/15">
            <CardHeader>
              <CardTitle>Novo parceiro</CardTitle>
              <p className="text-sm text-blue-gray">
                Use uma URL pública de imagem em PNG, WebP ou SVG.
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-4 md:grid-cols-[1fr_1.6fr_auto] md:items-end"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const success = await mutate(
                    {
                      action: "addPartner",
                      ...formValues(event.currentTarget),
                    },
                    "Parceiro adicionado.",
                  );
                  if (success) event.currentTarget.reset();
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="partner-name">Nome da instituição</Label>
                  <Input id="partner-name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-logo">URL da logomarca</Label>
                  <Input
                    id="partner-logo"
                    name="logo"
                    type="url"
                    placeholder="https://..."
                    required
                  />
                </div>
                <Button type="submit">
                  <Plus aria-hidden /> Adicionar
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {partners.map((partner) => (
              <Card key={partner.id} size="sm" className="overflow-hidden">
                <CardContent>
                  <div className="grid h-28 place-items-center rounded-xl bg-white p-3">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-ice-white">
                    {partner.name}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm(`Remover ${partner.name}?`))
                        void mutate(
                          { action: "deletePartner", id: partner.id },
                          "Parceiro removido.",
                        );
                    }}
                  >
                    <Trash2 aria-hidden /> Remover
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {busyAction ? (
        <div
          role="status"
          className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-xl border border-cyan-electric/20 bg-[#111329] px-4 py-3 text-sm text-ice-white shadow-xl"
        >
          <LoaderCircle
            className="size-4 animate-spin text-cyan-electric motion-reduce:animate-none"
            aria-hidden
          />{" "}
          Salvando alteração…
        </div>
      ) : null}
    </div>
  );
}

export { AdminDashboard };
