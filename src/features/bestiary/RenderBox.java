import net.minecraft.client.Minecraft;
import net.minecraft.util.ChatComponentText;

class RenderBox {
    public static void helloWorld() {
        ChatComponentText cp = new ChatComponentText("WICKED GAMINJG RIGHT HERE!!!");
        Minecraft.getMinecraft().thePlayer.addChatMessage(cp);
    }
}