import { FileSystemWrapper } from './fs';
import ProcessStub from './process';
import { Go } from './wasm_exec';
import {StdioWrapper, ConsoleLogger} from './stdio';

// TODO: Uncomment, when "go.ts" will be fixed
// import { Go, Global } from './go';

let instance: Go;
let wrapper: StdioWrapper;

export const goRun = async(m: WebAssembly.WebAssemblyInstantiatedSource) => {
    if (!instance) {
        throw new Error('Go runner instance is not initialized');
    }

    wrapper.reset();
    return instance.run(m.instance);
};

export const getImportObject = () => instance.importObject;

export const bootstrapGo = (logger: ConsoleLogger) => {
    if (instance) {
        // Skip double initialization
        return;
    }

    // Wrap Go's calls to os.Stdout and os.Stderr
    wrapper = new StdioWrapper(logger);

    // global overlay
    const globalWrapper = {
        fs: new FileSystemWrapper(wrapper.stdoutPipe, wrapper.stderrPipe),
        process: ProcessStub,
        Go: Go,
    };

    // Wrap global object to make it accessible to Go's wasm bridge
    Object.setPrototypeOf(globalWrapper, window);
    instance = new Go(globalWrapper);
};