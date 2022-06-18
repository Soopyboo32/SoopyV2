/// <reference types="../../../CTAutocomplete" />
/// <reference lib="es2015" />
import SoopyGuiElement from "../../../guimanager/GuiElement/SoopyGuiElement";
import SoopyTextElement from "../../../guimanager/GuiElement/SoopyTextElement";
import Feature from "../../featureClass/class";
import GuiPage from "../soopyGui/GuiPage";
import SoopyMarkdownElement from '../../../guimanager/GuiElement/SoopyMarkdownElement.js';
import metadata from "../../metadata";
import ButtonWithArrow from "../../../guimanager/GuiElement/ButtonWithArrow";
import SoopyMouseClickEvent from "../../../guimanager/EventListener/SoopyMouseClickEvent";
import ProgressBar from "../../../guimanager/GuiElement/ProgressBar"
import SoopyRenderEvent from "../../../guimanager/EventListener/SoopyRenderEvent"
import { fetch } from "../../utils/networkUtils";
import { numberWithCommas } from "../../utils/numberUtils";
const File = Java.type("java.io.File")
const URL = Java.type("java.net.URL");
const PrintStream = Java.type("java.io.PrintStream");
const Byte = Java.type("java.lang.Byte");

class ChangeLogGui extends Feature {
    constructor() {
        super()
    }

    onEnable() {
        this.initVariables()

        this.ChangelogPage = new ChangelogPage()

        this.latestAnnouncedVersion = this.ChangelogPage.currVersionId

        this.registerEvent("worldLoad", this.worldLoad)

        this.registerStep(false, 60 * 5, () => {
            this.ChangelogPage.loadChangeLog()
        })
    }

    worldLoad() {
        if (this.ChangelogPage.downloadableVersion === -1) return


        if (this.FeatureManager.features["globalSettings"] === undefined || this.FeatureManager.features["globalSettings"].class.alertAllUpdates === undefined) {
            return
        }
        let alertBeta = this.FeatureManager.features["globalSettings"].class.alertAllUpdates.getValue()

        if (this.latestAnnouncedVersion < alertBeta ? this.ChangelogPage.downloadableVersion : this.ChangelogPage.importantVersion) {
            let version = ""
            this.ChangelogPage.changelogData.forEach(data => {

                if (this.ChangelogPage.downloadableVersion === data.versionId && this.ChangelogPage.downloadableVersion > this.ChangelogPage.currVersionId) {
                    //add button to download this version
                    version = data.version
                }
            })

            ChatLib.chat("§r")
            ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
            ChatLib.chat("     &6New SoopyV2 Version is avalible (" + version + ")")
            ChatLib.chat("§r§r")
            new TextComponent(" &e[CLICK] &7- View changelog and download update").setHover("show_text", "&2Open changelog").setClick("run_command", "/soopyv2 changelog").chat()
            ChatLib.chat("&1" + ChatLib.getChatBreak("-").trim())
            ChatLib.chat("§r§r§r")

            this.latestAnnouncedVersion = this.ChangelogPage.downloadableVersion
        }
    }

    initVariables() {
        this.ChangelogPage = undefined
    }

    onDisable() {
        this.initVariables()
    }
}


class ChangelogPage extends GuiPage {
    constructor() {
        super(9)

        this.name = "Changelog"

        this.pages = [this.newPage()]

        this.changelogData = []
        this.downloadableVersion = -1

        this.importantVersion = -1

        let changelogTitle = new SoopyTextElement().setText("§0Changelog").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.pages[0].addChild(changelogTitle)

        this.changelogArea = new SoopyGuiElement().setLocation(0.1, 0.2, 0.8, 0.8).setScrollable(true)
        this.pages[0].addChild(this.changelogArea)

        //Update confirmation page
        this.updatingSidebar = new SoopyGuiElement().setLocation(0, 0, 1, 1)
        this.updatingSidebarConfirmPage = new SoopyGuiElement().setLocation(0, 0, 1, 1)
        this.updatingSidebar.addChild(this.updatingSidebarConfirmPage)

        this.updateTitle = new SoopyTextElement().setText("§0Update to SoopyV2 ").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.updatingSidebarConfirmPage.addChild(this.updateTitle)

        // this.warningMessage = new SoopyMarkdownElement().setLocation(0.1, 0.2, 0.8, 0.8)
        // this.warningMessage.setText(``)
        // this.updatingSidebarConfirmPage.addChild(this.warningMessage)

        this.updateButton = new ButtonWithArrow().setText("§0Update").setLocation(0.3, 0.3, 0.4, 0.2)
        this.updatingSidebarConfirmPage.addChild(this.updateButton)

        this.updatingSidebarConfirmPage.setScrollable(true)

        this.updateButton.addEvent(new SoopyRenderEvent().setHandler(() => {
            this.updateButton.location.location.y.set(0.3, 0)
        }))
        this.updateButton.addEvent(new SoopyMouseClickEvent().setHandler(() => {
            this.downloadUpdate()
        }))

        this.updatingSidebarLoadingPage = new SoopyGuiElement().setLocation(1, 0, 1, 1)
        this.updatingSidebar.addChild(this.updatingSidebarLoadingPage)

        let updatingTitle = new SoopyTextElement().setText("§0Updating...").setMaxTextScale(3).setLocation(0.1, 0.05, 0.8, 0.1)
        this.updatingSidebarLoadingPage.addChild(updatingTitle)

        this.progressBar = new ProgressBar().setLocation(0.1, 0.2, 0.8, 0.1)
        this.updatingSidebarLoadingPage.addChild(this.progressBar)

        this.currVersionId = metadata.versionId

        this.finaliseLoading()

        this.loadChangeLog()
    }

    loadChangeLog() {
        fetch("http://soopymc.my.to/api/soopyv2/changelog.json").json(data => {

            this.changelogData = data.changelog.reverse()

            this.downloadableVersion = data.downloadableVersion
            this.importantVersion = data.importantVersion

            this.updateText()
        })

    }

    onOpen() {
        this.loadChangeLog()
    }

    showConfirmUpdatePage() {
        let version = ""
        this.changelogData.forEach(data => {

            if (this.downloadableVersion === data.versionId && this.downloadableVersion > this.currVersionId) {
                //add button to download this version
                version = data.version
            }
        })
        this.updateTitle.setText("§0Update to SoopyV2 " + version)

        this.updateButton.location.location.y.set(0.3, 0)

        this.openSidebarPage(this.updatingSidebar)
    }

    downloadUpdate() {
        new Thread(() => {
            this.updatingSidebarConfirmPage.location.location.x.set(-1, 500)
            this.updatingSidebarLoadingPage.location.location.x.set(0, 500)

            new File("./config/ChatTriggers/modules/SoopyAddonsTempDownload").mkdir()

            this.progressBar.setProgress(0.1)

            this.urlToFile("http://soopymc.my.to/api/soopyv2/downloadLatest.zip", "./config/ChatTriggers/modules/SoopyAddonsTempDownload/SoopyAddons.zip", 10000, 20000)

            this.progressBar.setProgress(0.5)

            FileLib.unzip("./config/ChatTriggers/modules/SoopyAddonsTempDownload/SoopyAddons.zip", "./config/ChatTriggers/modules/SoopyAddonsTempDownload/SoopyAddons/")

            this.progressBar.setProgress(0.75)

            FileLib.deleteDirectory(new File("./config/ChatTriggers/modules/SoopyV2"))

            this.progressBar.setProgress(0.9)

            new File("./config/ChatTriggers/modules/SoopyAddonsTempDownload/SoopyAddons/SoopyV2").renameTo(new File("./config/ChatTriggers/modules/SoopyV2"))

            FileLib.deleteDirectory(new File("./config/ChatTriggers/modules/SoopyAddonsTempDownload"))

            this.progressBar.setProgress(1)

            Client.currentGui.close()

            ChatLib.command("ct load", true)
        }).start()
    }

    urlToFile(url, destination, connecttimeout, readtimeout) {
        const d = new File(destination);
        d.getParentFile().mkdirs();
        const connection = new URL(url).openConnection();
        connection.setDoOutput(true);
        connection.setConnectTimeout(connecttimeout);
        connection.setReadTimeout(readtimeout);
        const IS = connection.getInputStream();
        const FilePS = new PrintStream(destination);
        let buf = new Packages.java.lang.reflect.Array.newInstance(Byte.TYPE, 65536);
        let len;
        while ((len = IS.read(buf)) > 0) {
            FilePS.write(buf, 0, len);
        }
        IS.close();
        FilePS.close();
    }

    updateText() {
        this.changelogArea.children = []

        let height = 0

        this.changelogData.forEach(data => {

            if (this.downloadableVersion === data.versionId && this.downloadableVersion > this.currVersionId) {
                //add button to download this version
                let button = new ButtonWithArrow().setText("§0Download this version").setLocation(0.7, height, 0.3, 0.1)
                this.changelogArea.addChild(button)

                button.addEvent(new SoopyMouseClickEvent().setHandler(() => {
                    this.showConfirmUpdatePage()
                }))

                height += 0.05
            }

            let changes = new SoopyMarkdownElement().setLocation(0, height, 1, 0)

            this.changelogArea.addChild(changes)

            changes.setText("# __" + data.version + "__" + (data.versionId === this.currVersionId ? " §7Current (" : " §7(") + numberWithCommas(data.users || 0) + " using)" + "\n" + data.description)

            height += changes.getHeight()

            height += 0.1
        })
    }
}

module.exports = {
    class: new ChangeLogGui()
}