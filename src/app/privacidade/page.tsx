import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { InternalPageHero } from "@/components/event/internal-page-hero";

export const metadata = {
  title: "Aviso de Privacidade | SNCT Paulista 2026",
};

export default function PrivacyPage() {
  const contact = process.env.NEXT_PUBLIC_PRIVACY_CONTACT;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <EventHeader />
      <main>
        <InternalPageHero
          eyebrow="LGPD e transparência"
          title="Aviso de Privacidade"
          description="Como os dados pessoais são utilizados na inscrição e operação da SNCT Paulista 2026."
        />
        <article className="mx-auto max-w-4xl space-y-10 px-5 py-14 text-blue-gray sm:px-8">
          <section>
            <h2 className="font-display text-2xl font-semibold text-ice-white">
              Controlador e finalidade
            </h2>
            <p className="mt-4 leading-7">
              A Prefeitura do Paulista utiliza os dados informados para
              cadastrar participantes, autenticar acessos, emitir credenciais,
              realizar check-in, controlar a entrega de brindes, administrar o
              evento e atender direitos dos titulares.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-ice-white">
              Dados tratados
            </h2>
            <p className="mt-4 leading-7">
              O portal trata nome, e-mail, idade, credenciais técnicas de
              autenticação, registros de consentimento, check-in e entrega de
              brinde. Senhas são protegidas com Argon2id e não podem ser
              recuperadas em texto aberto. O QR Code usa um identificador
              aleatório e não contém nome ou e-mail.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-ice-white">
              Crianças e adolescentes
            </h2>
            <p className="mt-4 leading-7">
              Cadastros de menores exigem confirmação de ciência do responsável.
              O tratamento deve observar o melhor interesse da criança e do
              adolescente. Responsáveis podem solicitar acesso, correção ou
              exclusão pelos canais do controlador.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-ice-white">
              Compartilhamento e retenção
            </h2>
            <p className="mt-4 leading-7">
              Os dados operacionais não são vendidos. O acesso é limitado à
              equipe autorizada e aos fornecedores de infraestrutura
              estritamente necessários. O prazo padrão de retenção é de 24 meses
              após o cadastro, salvo obrigação legal ou necessidade de
              preservação de registros de segurança.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-semibold text-ice-white">
              Seus direitos
            </h2>
            <p className="mt-4 leading-7">
              O titular pode confirmar o tratamento, acessar e corrigir dados,
              solicitar portabilidade, revogar consentimento e pedir
              anonimização, bloqueio ou exclusão quando aplicável. A área do
              participante permite exportar os dados e iniciar a exclusão da
              conta.
            </p>
          </section>
          <section className="rounded-2xl border border-cyan-electric/20 bg-cyan-electric/5 p-6">
            <h2 className="font-display text-xl font-semibold text-ice-white">
              Contato de privacidade
            </h2>
            <p className="mt-3 leading-7">
              {contact ? (
                <>
                  Envie sua solicitação para{" "}
                  <a
                    className="font-semibold text-cyan-electric underline"
                    href={`mailto:${contact}`}
                  >
                    {contact}
                  </a>
                  .
                </>
              ) : (
                "O canal oficial do encarregado será publicado pela Prefeitura do Paulista antes da abertura das inscrições."
              )}
            </p>
          </section>
          <p className="text-xs">Versão do aviso: 20 de julho de 2026.</p>
        </article>
      </main>
      <EventFooter />
    </div>
  );
}
