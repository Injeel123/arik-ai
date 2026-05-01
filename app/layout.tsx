export default function RootLayout({ children }) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}