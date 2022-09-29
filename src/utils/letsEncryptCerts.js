// Semisol was here
let certificates = [
    "ISRGRootX1.cer"
] // Certificate names
const
    JKeyStore = Java.type("java.security.KeyStore"),
    JPaths = Java.type("java.nio.file.Paths"),
    JSystem = Java.type("java.lang.System"),
    JFiles = Java.type("java.nio.file.Files"),
    JCertificateFactory = Java.type("java.security.cert.CertificateFactory"),
    JString = Java.type("java.lang.String"),
    JByteArrayInputStream = Java.type("java.io.ByteArrayInputStream"),
    JTrustManagerFactory = Java.type("javax.net.ssl.TrustManagerFactory"),
    JSSLContext = Java.type("javax.net.ssl.SSLContext")
let keyStore = JKeyStore.getInstance(JKeyStore.getDefaultType())
let ksPath = JPaths.get(JSystem.getProperty("java.home"), "lib", "security", "cacerts")
keyStore.load(JFiles.newInputStream(ksPath), new JString("changeit").toCharArray())
let cf = JCertificateFactory.getInstance("X.509")
for (let i of certificates) {
    let pathStr = `${Config.modulesFolder}/SoopyV2/utils/certs/${i}`
    let path = JPaths.get(pathStr)
    let data = JFiles.readAllBytes(path)
    let cert = cf.generateCertificate(new JByteArrayInputStream(data))
    keyStore.setCertificateEntry("dev.semisol.letsencryptsupport:" + i, cert)
}
let tmf = JTrustManagerFactory.getInstance(JTrustManagerFactory.getDefaultAlgorithm())
tmf.init(keyStore)
let sslContext = JSSLContext.getInstance("TLS")
sslContext.init(null, tmf.getTrustManagers(), null);
JSSLContext.setDefault(sslContext)
let socketFactory = sslContext.getSocketFactory()
export { socketFactory as default };
