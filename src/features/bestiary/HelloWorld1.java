import net.minecraft.client.Minecraft;
import net.minecraft.util.ChatComponentText;

class HelloWorld1 {
    public static void helloWorld() {
        ChatComponentText cp = new ChatComponentText("WICKED GAMINJG RIGHT HERE!!!");
        Minecraft.getMinecraft().thePlayer.addChatMessage(cp);
    }
}