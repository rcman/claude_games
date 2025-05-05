# How to compile Amiga Assembly on Linux.


<BR>
Steps to Compile Amiga Assembly on Linux<BR>
Install vasm:<BR>
Download vasm from its official site: http://sun.hasenbraten.de/vasm/<BR>
Extract the tarball:<BR>
bash<BR>

Copy<BR>
tar -xvzf vasm.tar.gz<BR>
Compile vasm from source:<BR>
bash<BR>

Copy<BR>
cd vasm<BR>
make CPU=m68k SYNTAX=mot<BR>
Copy the vasm binary to a system path (e.g., /usr/local/bin):<BR>
bash<BR>

Copy<BR>
sudo cp vasm /usr/local/bin<BR>
Set Up Your Assembly Code:<BR>
Create a simple Amiga Assembly file (e.g., test.s). For example:<BR>
assembly<BR>

Copy<BR>
; Simple Amiga Assembly program<BR>
section code,code<BR>
move.l #0,d0<BR>
rts<BR>
Save it in your working directory.<BR>
Compile the Assembly Code:<BR>
Use vasm to assemble the code into an Amiga-compatible binary:<BR>
bash<BR>

Copy<BR>
vasm -Fbin -o test test.s<BR>
The -Fbin option generates a raw binary. For AmigaOS-compatible executables, you might use -Fhunk:<BR>
bash<BR>

Copy
vasm -Fhunk -o test test.s<BR>
Verify the output with:<BR>
bash

Copy<BR>
file test<BR>
It should indicate an AmigaOS executable (e.g., test: AmigaOS loadseg()ble executable/binary).<BR>
Test the Binary:<BR>
Use an Amiga emulator like FS-UAE or WinUAE on Linux to run the compiled binary.<BR>
Install FS-UAE:<BR>
bash

Copy<BR>
sudo apt-get install fs-uae<BR>
Configure FS-UAE with an AmigaOS Kickstart ROM and transfer the binary to the emulated Amiga environment (e.g., via a shared folder or ADF disk image).<BR>
Run the binary in the emulator to test.<BR>
Optional: Set Up a Development Environment:<BR>
For convenience, use Visual Studio Code with the Amiga Assembly extension for syntax highlighting and integration<BR>.<BR>
Create a directory for Amiga development to organize your assembler, scripts, and documentation.<BR>
Consider installing the AmigaOS 3.9 NDK (Native Development Kit) for system includes and libraries, available on Aminet. Set environment variables for include paths:<BR>
bash

Copy
export NDK=/path/to/NDK_3.9<BR>
export NDK_INC=$NDK/Include/include_h<BR>

Why vasm?<BR>
Ease of Use: vasm supports Motorola syntax, which matches traditional Amiga assemblers, making it easy to use existing code from 1980s books or magazines.<BR>
Active Maintenance: Unlike older tools, vasm is still updated and works well on modern Linux systems.<BR>
Flexibility: It supports multiple output formats (e.g., hunk for Amiga executables, raw binaries for demos).<BR>
Tips<BR>
For more complex projects, pair vasm with vlink (linker) to handle multiple object files: http://sun.hasenbraten.de/vlink/[]()<BR>
Check out tutorials like those from ScoopexUS on YouTube or Photon’s Amiga assembly course for learning the m68k architecture.<BR>
If you encounter issues, the Amiga community on forums like English Amiga Board (eab.abime.net) or Reddit’s r/amiga can provide support.<BR>
This setup is minimal, modern, and leverages Linux’s strengths for Amiga development. Let me know if you need help with specific steps or tools!<BR>
