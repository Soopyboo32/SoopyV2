import java.io.File;
import java.io.FileInputStream;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Scanner;

import javassist.ClassPool;
import javassist.CtClass;
import javassist.bytecode.ConstPool;

class Main {
    public static void main(String[] args) throws Exception {

        Mappings mappings = new Mappings();

        ClassPool _classPool = ClassPool.getDefault();
        CtClass _ctClass = _classPool.makeClass(new FileInputStream(new File(args[0])));
        ConstPool cPool = _ctClass.getClassFile().getConstPool();
        _ctClass.defrost();

        for (int i = 1; i < cPool.getSize(); i++) {
            int tag = cPool.getTag(i);
            if (tag == ConstPool.CONST_Methodref) {
                // System.out.println("-------- METHOD REF --------");
                // System.out.println(cPool.getMethodrefClassName(i));
                // System.out.println(cPool.getMethodrefName(i));
                // System.out.println(cPool.getMethodrefType(i));

                String className = cPool.getMethodrefClassName(i); // net.minecraft.client.Minecraft
                String methodName = cPool.getMethodrefName(i); // getMinecraft
                String methodSigniture = cPool.getMethodrefType(i); // ()Lnet/minecraft/client/Minecraft;

                String remap = mappings.remapMethod(className, methodName, methodSigniture); // func_71410_x
                // System.out.println("Mapping To: " + remap);

                if (remap != null) {
                    int index = cPool.getMethodrefNameAndType(i);
                    int index2 = cPool.getNameAndTypeName(index);

                    Method getItem = ConstPool.class.getDeclaredMethod("getItem", int.class);
                    getItem.setAccessible(true);

                    Object info = getItem.invoke(cPool, index2); // type ConstInfo
                    if (info != null) {
                        Field stringF = info.getClass().getDeclaredField("string");
                        stringF.setAccessible(true);
                        stringF.set(info, remap);
                    }
                }

                // System.out.println("-------------");
            }
            if (tag == ConstPool.CONST_Fieldref) {
                // System.out.println("-------- FIELD REF --------");
                // System.out.println(cPool.getFieldrefClassName(i));
                // System.out.println(cPool.getFieldrefName(i));
                // System.out.println(cPool.getFieldrefType(i));

                String className = cPool.getFieldrefClassName(i); // net.minecraft.client.Minecraft
                String fieldName = cPool.getFieldrefName(i); // getMinecraft

                String remap = mappings.remapField(className, fieldName); // func_71410_x
                // System.out.println("Mapping To: " + remap);

                if (remap != null) {
                    int index = cPool.getFieldrefNameAndType(i);
                    int index2 = cPool.getNameAndTypeName(index);

                    Method getItem = ConstPool.class.getDeclaredMethod("getItem", int.class);
                    getItem.setAccessible(true);

                    Object info = getItem.invoke(cPool, index2); // type ConstInfo
                    if (info != null) {
                        Field stringF = info.getClass().getDeclaredField("string");
                        stringF.setAccessible(true);
                        stringF.set(info, remap);
                    }
                }

                // System.out.println("-------------");
            }
        }

        // Write changes to class file
        _ctClass.writeFile(args[1]);
    }

    static class Mappings {

        HashMap<String, String> fieldMap = new HashMap<>();
        HashMap<String, String> methodMap = new HashMap<>();

        ArrayList<String[]> classToMap = new ArrayList<>();

        public Mappings() throws Exception {
            HashMap<String, String> methods = new HashMap<>(); // hash from obv to readable
            try (Scanner scanner = new Scanner(new File("methods.csv"));) {
                while (scanner.hasNextLine()) {
                    List<String> line = getRecordFromLine(scanner.nextLine());

                    methods.put(line.get(0), line.get(1));
                }
            }
            HashMap<String, String> fields = new HashMap<>(); // hash from obv to readable
            try (Scanner scanner = new Scanner(new File("fields.csv"));) {
                while (scanner.hasNextLine()) {
                    List<String> line = getRecordFromLine(scanner.nextLine());

                    fields.put(line.get(0), line.get(1));
                }
            }

            String currentClass = "";

            try (Scanner scanner = new Scanner(new File("joined.tsrg"));) {
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine();

                    if (line.startsWith("	")) {
                        // Line is a specific function/method reference
                        // " D field_175613_B"

                        String[] parts = line.split(" ");

                        if (parts.length == 2) {
                            // is Field eg
                            // " D field_175613_B"
                            String demapName = parts[1]; // field_175613_B

                            fieldMap.put(currentClass + " | " + fields.get(demapName), demapName);
                        } else {
                            // is method eg
                            // " A ()Lave; func_71410_x"
                            String signiture = parts[1]; // ()Lcom/google/common/util/concurrent/ListenableFuture;
                            String demapName = parts[2]; // func_71410_x

                            methodMap.put(currentClass + " | " + methods.get(demapName) + " | " + signiture,
                                    demapName);
                        }

                    } else {
                        // Line is class defenition
                        // "ave net/minecraft/client/Minecraft"
                        // "aum$1 net/minecraft/scoreboard/Score$1"
                        currentClass = line.replaceFirst("[a-zA-Z$0-9]+ ", "").replaceAll("/", ".");

                        classToMap.add(new String[] { line.replaceFirst("[a-zA-Z$0-9]+ ", ""), line.split(" ")[0] });
                    }
                }
            }
        }

        public String remapMethod(String className, String methodName, String methodSigniture) {
            // methodSigniture like ()Lnet/minecraft/client/Minecraft;
            // Want it like ()Lave; cus ave -> net/minecraft/client/Minecraft

            String actualSig = methodSigniture;
            for (String[] data : classToMap) {
                actualSig = actualSig.replace(data[0], data[1]);
            }
            // // System.out.println(methodSigniture + " -> " + actualSig);

            String deMapName = methodMap.get(className + " | " + methodName + " | " + actualSig);

            return deMapName;
        }

        public String remapField(String className, String methodName) {

            String deMapName = fieldMap.get(className + " | " + methodName);

            return deMapName;
        }

        private List<String> getRecordFromLine(String line) {
            List<String> values = new ArrayList<String>();
            try (Scanner rowScanner = new Scanner(line)) {
                rowScanner.useDelimiter(",");
                while (rowScanner.hasNext()) {
                    values.add(rowScanner.next());
                }
            }
            return values;
        }
    }
}