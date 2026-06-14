const CryptoJS = require('crypto-js');

const encrypted = "U2FsdGVkX1//oN3bNcEISIROeQocL2UN0lE/TQZxBMRY0GrCowFo8GQNK+nbXMahjjljjGp0S83iqXO55RLC+Q==";
const SECRET = "ghost-player-secret-2024";

try {
  const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  console.log("DECRYPTED=" + decrypted);
  console.log("SUCCESS=" + (decrypted === "https://www.youtube.com/watch?v=dQw4w9WgXcQ"));
} catch(e) {
  console.log("ERROR=" + e.message);
}
