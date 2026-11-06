async function main() {
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID =
    "214191835958-mmja3vhe716ubvbure8oacs26favin4j.apps.googleusercontent.com";
  process.env.NEXT_PUBLIC_SPREADSHEET_ID = "1-f4wd3NPeZOfSD03CA29b1wMhpMa-Pg8sOnOsbKrMNg";
  process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL = "brianjosue1900@gmail.com";

  const { assertAllowedAccount, allowedGoogleEmails, isUsingMockData } = await import("../lib/config");

  function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message);
  }

  function rejects(email: string) {
    try {
      assertAllowedAccount(email);
    } catch {
      return;
    }
    throw new Error(`debería rechazar ${email || "(vacío)"}`);
  }

  assert(allowedGoogleEmails().length === 1, "la lista tiene una sola cuenta");
  assert(allowedGoogleEmails()[0] === "brianjosue1900@gmail.com", "la cuenta es la confirmada");
  assert(isUsingMockData() === false, "con los tres valores no usa mocks");
  assertAllowedAccount("brianjosue1900@gmail.com");
  assertAllowedAccount("BrianJosue1900@gmail.com");
  rejects("otra@gmail.com");
  rejects("brianjosue1900@googlemail.com");
  rejects("");

  process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL = "";
  assert(isUsingMockData() === true, "sin correo autorizado vuelve a los mocks");
  rejects("brianjosue1900@gmail.com");
  rejects("otra@gmail.com");

  process.env.NEXT_PUBLIC_ALLOWED_GOOGLE_EMAIL = "otra@gmail.com";
  rejects("brianjosue1900@gmail.com");

  console.log("allowlist: solo brianjosue1900@gmail.com");
}

void main();
