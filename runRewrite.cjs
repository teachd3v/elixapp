const fs = require('fs');
let code = fs.readFileSync('app/page.jsx', 'utf8');

const importClerk = `import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';\n`;

// Insert the imports right after "use client";
code = code.replace('"use client";', '"use client";\n' + importClerk);

// Wrap the return statement
const returnIndex = code.indexOf('return (');
const returnJSX = code.substring(returnIndex);

const newReturnJSX = `return (
    <>
      <SignedOut>
        <div className={\`min-h-screen flex items-center justify-center \${logic.darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}\`}>
          <div className={\`max-w-md w-full \${logic.darkMode ? 'bg-slate-800' : 'bg-white'} p-8 rounded-3xl shadow-xl\`}>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center mb-2">Welcome to Elix</h1>
            <p className="text-center text-sm mb-8 opacity-70">
              Platform Evaluasi dan Pembelajaran Interaktif. Silakan login untuk melanjutkan.
            </p>

            <div className="space-y-4">
              <SignInButton mode="modal">
                <button className={\`w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]\`}>
                  Login dengan Akun Google
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        ${returnJSX.substring(8, returnJSX.length - 2)}
      </SignedIn>
    </>
  );`;

code = code.substring(0, returnIndex) + newReturnJSX + '}\n\nexport default App;';
// Oh wait, `returnJSX` ended with `}\n\nexport default App;`.
// Let's just do a clean string replacement.
fs.writeFileSync('rewrite_page.cjs', `
const fs = require('fs');
let code = fs.readFileSync('app/page.jsx', 'utf8');

const importClerk = "import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';\\n";
code = code.replace('"use client";', '"use client";\\n' + importClerk);

const startReturn = code.indexOf('return (');
const endReturn = code.lastIndexOf(');');

const innerJSX = code.substring(startReturn + 8, endReturn);

const newJSX = \`return (
    <>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center \${logic.darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}">
          <div className="max-w-md w-full \${logic.darkMode ? 'bg-slate-800' : 'bg-white'} p-8 rounded-3xl shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform rotate-3">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-center mb-2">Welcome to Elix</h1>
            <p className="text-center text-sm mb-8 opacity-70">
              Platform Evaluasi dan Pembelajaran Interaktif. Silakan login untuk melanjutkan.
            </p>

            <SignInButton mode="modal" forceRedirectUrl="/">
              <button className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-2xl cursor-pointer shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]">
                Login dengan Akun Google
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        \${innerJSX}
      </SignedIn>
    </>
  );\`;

code = code.substring(0, startReturn) + newJSX + code.substring(endReturn + 2);

fs.writeFileSync('app/page.jsx', code);
`);
