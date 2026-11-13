export default function SiteFooter({ theme = "home" }: { theme?: "home" | "hamila" | "lotus" }) {
  return (
    <footer className={`pd-footer pd-footer-${theme}`}>
      <b>پادرا پارک</b> — پارک بازی به نفع زمین پاک
    </footer>
  );
}
