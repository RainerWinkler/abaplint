import {expect} from "chai";
import {Registry} from "../../src/registry";
import {MemoryFile} from "../../src/files/memory_file";
import {Interface} from "../../src/objects";

// todo, most(all?) of these tests to be moved to abap/types/

describe("Objects, interface, isGeneratedProxy", () => {
  it("test, positive", () => {
    const abap = "INTERFACE zif_foobar PUBLIC.\n" +
      "  METHODS method1 IMPORTING foo TYPE i.\n" +
      "ENDINTERFACE.";
    const reg = new Registry().addFile(new MemoryFile("zif_foobar.intf.abap", abap));

    const xml = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
      "<abapGit version=\"v1.0.0\" serializer=\"LCL_OBJECT_INTF\" serializer_version=\"v1.0.0\">\n" +
      "<asx:abap xmlns:asx=\"http://www.sap.com/abapxml\" version=\"1.0\">\n" +
      "<asx:values>\n" +
      "<VSEOINTERF>\n" +
      "<CLSNAME>ZIF_FOOBAR</CLSNAME>\n" +
      "<LANGU>E</LANGU>\n" +
      "<DESCRIPT>Proxy Interface (generated)</DESCRIPT>\n" +
      "<EXPOSURE>2</EXPOSURE>\n" +
      "<STATE>1</STATE>\n" +
      "<UNICODE>X</UNICODE>\n" +
      "<CLSPROXY>X</CLSPROXY>\n" +
      "</VSEOINTERF>\n" +
      "</asx:values>\n" +
      "</asx:abap>\n" +
      "</abapGit>";
    reg.addFile(new MemoryFile("zif_foobar.intf.xml", xml));

    reg.parse();
    const intf = reg.getABAPObjects()[0] as Interface;
    expect(intf.isGeneratedProxy()).to.equal(true);
  });
});