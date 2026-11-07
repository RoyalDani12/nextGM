import http from "http";
import dotenv from "dotenv";
dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/v1/auth/google/callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing in .env");
  process.exit(1);
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
  CLIENT_ID
)}&redirect_uri=${encodeURIComponent(
  REDIRECT_URI
)}&response_type=code&scope=${encodeURIComponent(
  SCOPES
)}&access_type=offline&prompt=consent`;

console.log("\n==================================================================");
console.log("🔗 GOOGLE GMAIL API TOKEN GENERATOR");
console.log("==================================================================");
console.log("\n1. Open this link in your browser:\n");
console.log(authUrl);
console.log("\n2. Log in with your Gmail (dani21.dev@gmail.com) and click 'Continue' / 'Allow'.");
console.log("3. Waiting for Google redirect on port 5000...\n");

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (error) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`<h1>Error: ${error}</h1>`);
      console.error("❌ Google returned an error:", error);
      server.close();
      process.exit(1);
      return;
    }

    if (!code) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end(`<h1>Token exchange failed</h1><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
      console.error("❌ Token exchange failed:", tokenData);
      server.close();
      process.exit(1);
      return;
    }

    const refreshToken = tokenData.refresh_token;

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <div style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1 style="color: #10B981;">🎉 Authorization Successful!</h1>
        <p style="font-size: 16px;">You can close this tab and check your terminal.</p>
      </div>
    `);

    console.log("\n==================================================================");
    console.log("🎉 SUCCESS! YOUR GMAIL REFRESH TOKEN IS:");
    console.log("==================================================================");
    console.log(`\nGMAIL_REFRESH_TOKEN=${refreshToken}\n`);
    console.log("==================================================================");
    console.log("👉 Add GMAIL_REFRESH_TOKEN to your server/.env and to your Render Environment Variables!");
    console.log("==================================================================\n");

    server.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    res.writeHead(500);
    res.end("Internal Server Error");
    server.close();
    process.exit(1);
  }
});

server.listen(5000, () => {
  console.log("🎧 Local callback listener active at: " + REDIRECT_URI);
});
