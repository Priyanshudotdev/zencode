import fs from "node:fs";
import path from "node:path";
import { type FunctionDeclaration, GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
      apiKey: Bun.env.GEMINI_API_KEY
});

const SYSTEM_PROMPT = `You are an expert coding assistant tasked with solving software engineering issues. 
You have direct access to the workspace files through your provided tools. 
Analyze the user request, explore the file tree using your tools, and make modifications if necessary to complete the task.`;


const resolvePath = (filename:string):string =>{
    const filepath = path.join(path.resolve(),"/data", filename);
    
    if(!fs.existsSync(filepath)){
        fs.writeFileSync(filepath, '', 'utf-8');
    }

    return filepath;
}


const TOOL_REGISTRY:Record<string, Function> = {
    "read_files": (args: { filename: string }) => {
        const filePath = resolvePath(args.filename);
        const content = fs.readFileSync(filePath).toString();
        return { filePath, content };
    },

    "list_files": () => {
        const fullPath = path.join(path.resolve(), "/data");
        if (!fs.existsSync(fullPath)) return [];
        
        return fs.readdirSync(fullPath).map((filename) => {
            const filePath = path.join(fullPath, filename);
            const result = {
                filePath, type: fs.lstatSync(filePath).isDirectory() ? "dir" : "file"
            };
            console.log(filename);
            return result;
        });
    },

    "write_files": (args: { filename: string, newContent: string }) => {
        const filePath = resolvePath(args.filename);
        try {
            fs.writeFileSync(filePath, args.newContent);
            console.log("write operation successfull");
            return { path: filePath, action: "edited" };
        } catch (err) {
            console.error(err);
            return { path: filePath, action: "failed" };
        }
    }
} as const;


const readFilesDeclaration: FunctionDeclaration = {
    name: "read_files",
    description: "Gets the full content of a file provided by the user within the data directory.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filename: {
                type: Type.STRING,
                description: "The name of the file to read (e.g., 'index.ts').",
            },
        },
        required: ["filename"],
    },
}

const listFilesDeclaration: FunctionDeclaration = {
    name: "list_files",
    description: "Lists all files and directories inside the root default /data directory.",
    parameters: {
        type: Type.OBJECT,
        properties: {},
    },
};

const writeFilesDeclaration: FunctionDeclaration = {
    name: "write_files",
    description: "Overwrites or creates a file inside the data directory with new content.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            filename: {
                type: Type.STRING,
                description: "The target filename to create or modify.",
            },
            newContent: {
                type: Type.STRING,
                description: "The full text content to write into the file.",
            },
        },
        required: ["filename", "newContent"],
    },
};

const geminiToolsConfig = [
    {
        functionDeclarations: [
            readFilesDeclaration,
            listFilesDeclaration,
            writeFilesDeclaration
        ]
    }
];

async function runCodingAssistant(userMessage: string) {
    const contents: any[] = [
        {
            role: "user",
            parts: [{ text: userMessage }],
        },
    ];

    try {
        while (true) {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents,
                config: {
                    systemInstruction: SYSTEM_PROMPT,
                    tools: geminiToolsConfig,
                },
            });

            const functionCalls = response.functionCalls;

            // Final answer
            if (!functionCalls || functionCalls.length === 0) {
                return response.text;
            }

            // Add the model's function call message
            contents.push({
                role: "model",
                parts: functionCalls.map((call) => ({
                    functionCall: {
                        name: call.name,
                        args: call.args,
                    },
                })),
            });

            // Execute every tool call
            for (const call of functionCalls) {
                const toolName = call.name as keyof typeof TOOL_REGISTRY;

                if (!TOOL_REGISTRY[toolName]) {
                    throw new Error(`Unknown tool: ${toolName}`);
                }

                const result = await TOOL_REGISTRY[toolName](call.args);

                // Send tool result back to Gemini
                contents.push({
                    role: "user",
                    parts: [
                        {
                            functionResponse: {
                                name: call.name,
                                response: result,
                            },
                        },
                    ],
                });
            }
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

runCodingAssistant("Create a python file to solve the two sum problem of leetcode.");