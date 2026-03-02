export function Footer() {
  return (
    <footer className="w-full py-5 px-6 bg-card/50 backdrop-blur-sm border-t border-border/30 mt-auto">
      <div className="container mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          Desenvolvido por{" "}
          <a
            href="https://averoagency.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Guilherme Santos - Avero Agency
          </a>
        </p>
      </div>
    </footer>
  )
}
