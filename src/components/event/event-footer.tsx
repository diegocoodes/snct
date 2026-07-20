function EventFooter() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display font-semibold text-foreground">
            SNCT Paulista 2026
          </p>
          <p className="mt-1">Ciência, tecnologia e inovação para todos.</p>
        </div>
        <nav aria-label="Links institucionais" className="flex flex-wrap gap-5">
          <a href="/perguntas-frequentes" className="hover:text-foreground">
            Acessibilidade
          </a>
          <a href="/perguntas-frequentes" className="hover:text-foreground">
            Privacidade
          </a>
          <a href="/perguntas-frequentes" className="hover:text-foreground">
            Termos de uso
          </a>
        </nav>
        <p>© 2026 Organização do evento</p>
      </div>
    </footer>
  );
}

export { EventFooter };
