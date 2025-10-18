import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";

export const MenuBar = () => {
  return (
    <Menubar className="border-none bg-transparent">
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New <MenubarShortcut>⌘N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Open <MenubarShortcut>⌘O</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>⌘S</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Save As...</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export as PNG</MenubarItem>
          <MenubarItem>Export as SVG</MenubarItem>
          <MenubarItem>Export as PDF</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>⌘⇧Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Cut <MenubarShortcut>⌘X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Copy <MenubarShortcut>⌘C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste <MenubarShortcut>⌘V</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Delete <MenubarShortcut>⌫</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>Select All</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Grid</MenubarItem>
          <MenubarItem>Page View</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Zoom In</MenubarItem>
          <MenubarItem>Zoom Out</MenubarItem>
          <MenubarItem>Actual Size</MenubarItem>
          <MenubarItem>Fit to Screen</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Arrange</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Bring to Front</MenubarItem>
          <MenubarItem>Send to Back</MenubarItem>
          <MenubarItem>Bring Forward</MenubarItem>
          <MenubarItem>Send Backward</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Group</MenubarItem>
          <MenubarItem>Ungroup</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Align Left</MenubarItem>
          <MenubarItem>Align Center</MenubarItem>
          <MenubarItem>Align Right</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Help</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Documentation</MenubarItem>
          <MenubarItem>Keyboard Shortcuts</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>About BioSketch</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};
