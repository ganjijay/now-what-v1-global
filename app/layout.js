import "./globals.css";

export const metadata = {
  title: "NowWhat — Know what to do next.",
  description:
    "Upload a photo, screenshot, PDF, email, or message. NowWhat explains what it means, what to do next, when it is due, and writes a reply.",
  applicationName: "NowWhat"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
