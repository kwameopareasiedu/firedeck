import { FileTree } from "@/types";

export function generateProjectFileTree(opts: {
  projectName: string;
  projectDescription: string;
  projectVersion: string;
  projectAuthor: string;
}): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "${opts.projectName}",
        "description": "${opts.projectDescription}",
        "version": "${opts.projectVersion}",
        "author": "${opts.projectAuthor}",
        "private": true,
        "type": "module",
        "scripts": {
          "dev": "firedeck run",
          "build": "firedeck build"
        },
        "devDependencies": {
          "@tailwindcss/vite": "^4.3.0",
          "@types/node": "^24.13.2",
          "@types/react": "^19.2.17",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^6.0.3",
          "prettier": "3.9.4",
          "react": "^19.2.7",
          "react-dom": "^19.2.7",
          "react-router": "^8.2.0",
          "tailwindcss": "^4.3.0",
          "turbo": "^2.10.4",
          "typescript": "~6.0.2",
          "typescript-eslint": "^8.62.0",
          "vite": "^8.1.1"
        }
      }`,
    },

    ".gitignore": {
      content: [
        ".firedeck",
        ".idea",
        ".vscode",
        "node_modules",
        "dist",
        "temp",
        ".firebase",
        ".env",
        ".env*",
        "!.env.sample",
      ].join("\n"),
      extension: "md",
    },

    "tsconfig.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ESNext",
          "module": "ESNext",
          "moduleResolution": "Bundler",
          "esModuleInterop": true,
          "forceConsistentCasingInFileNames": true,
          "jsx": "react-jsx",
          "strict": true,
          "noEmit": true,
          "skipLibCheck": true,
          "rootDir": ".",
          "baseUrl": ".",
          "paths": {
            "@/*": ["modules/*"]
          }
        },
        "include": ["modules"]
      }`,
    },

    ".prettierrc": {
      content: `
      {
        "tabWidth": 2,
        "useTabs": false,
        "printWidth": 100,
        "singleQuote": false,
        "jsxSingleQuote": false,
        "trailingComma": "all",
        "semi": true,
        "bracketSameLine": true,
        "arrowParens": "always"
      }`,
      extension: "json",
    },

    "firedeck.json": {
      content: `
      {}`,
    },

    "modules/main/client/index.html": {
      content: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>main</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/index.tsx"></script>
        </body>
      </html>`,
    },

    "modules/main/client/index.css": {
      content: '@source "./pages/**/*.tsx";',
    },

    "modules/main/client/index.tsx": {
      content: `
      import type { ReactNode } from "react";
      
      export default function (appRouter: ReactNode) {
        return appRouter;
      }`,
    },

    "modules/main/client/pages/index-page.tsx": {
      content: `
      export default function IndexPage() {
        return (
          <div className="h-screen bg-black flex flex-col items-center justify-center">
            <div className="w-full max-w-96 max-sm:px-8">
              <img
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA+kAAACjCAYAAAD2Fl/oAAAQAElEQVR4Aezcb+g0R30A8Pu1QaNtqQHBJpYSTPBPbLTaFwHTEKK+SJDaB1ERkoiIEFTUUNCCKCJoCyI1xr4QJIpBQRF80hL1RTSC4ptQqKhELGojNIZWArYQFNFev5Mn98ve/m7v9uZud2d3PzLz3O7e7s7MZ743u6PO7/cW/kOAAAECBAgQIECAAAECBAgUIdDhJL2I9qkEAQIECBAgQIAAAQIECBAYjcA4J+mj4VVRAgQIECBAgAABAgQIECDQXsAkvWZllwABAgQIECBAgAABAgQIDCVgkt6fvJIIECBAgAABAgQIECBAgMBWAZP0rTxj+VI9CRAgQIAAAQIECBAgQGAKAibpU+jFLtvg3gQIECBAgAABAgQIECDQm4BJem/UCqoL2CdAgAABAgQIECBAgACBdQGT9HUPe9MQ0AoCBAgQIECAAAECBAiMUsAkfZTdptLDCSiZAAECBAgQIECAAAEC3QmYpHdn684E9hNwNgECBAgQIECAAAECsxcwSZ99CACYg4A2EiBAgAABAgQIECAwDgGT9HH0k1oSKFVAvQgQIECAAAECBAgQOKKASfoRMd2KAIFjCrgXAQIECBAgQIAAgfkJmKTPr8+1mAABAgQIECBAgAABAgQKFTBJL7RjVIsAgXEKqDUBAgQIECBAgACBQwRM0g/Rcy0BAgT6E1ASAQIECBAgQIDADARM0mfQyZpIgACB7QK+JUCAAAECBAgQKEXAJL2UnlAPAgQITFFAmwgQIECAAAECBPYS6HSSvlwur4p8Z2b+UuZ1n4vrPhs5p9z7M6/7cuZ1qY7nM689pMwb94qSA0+O9g0RB8n2igOrvtfl0c6/iZzKzclDxEHfZabf5j9nGr1tr84Y8ORo3yHxPpcxKDf2vhG+p7+vPbf7Hg8OiYPc59+9YZL7/Mvtk0OeRbllfmTAn/heRUd/iIPlctdvNjcODom9Xt+D9gqa2skRQ7dH3mW46fv0zM0dD+byLOo1DqIfhxgPUmz0+vyrhfBeu2F0R+RU533z5MaDTifp0SuXR35HZn5l5nU3x3VvjJxT7g2Z170q87pUx3OZ1x5S5jVRZp9piDhItpf12cgo69rIqdycPEQc9F1m+m2+OtMo1TUuHUU6JN7nMgal/sz5nVwfEZBzXbpmn/Egijk4HRIHuc+/9FzIff7l9kkqM/nm5Nwybzu4d/q7gThYLHbFRm4cHBJ7fb8HHRJxr42Ldxlu+j49c3PHg7k8i/qOgyHGgxQbfT//ImSz07viylTnffPkxoOuJ+nhLBEgQIAAAQIXBPxLgAABAgQIENguYJK+3ce3BAgQIEBgHAJqSYAAAQIECExCwCR9Et2oEQQIECBAoDsBdyZAgAABAgT6EzBJ789aSQQIECBAgMC6gD0CBAgQIECgJmCSXgOxS4AAAQIECExBQBsIECBAgMA4BUzSx9lvak2AAAECBAgMJaBcAgQIECDQoYBJeoe4bk2AAAECBAgQ2EfAuQQIECBAwCRdDBAgQIAAAQIEpi+ghQQIECAwEgGT9JF0lGoSIECAAAECBMoUUCsCBAgQOKaASfoxNcdzr+cvl8tzLfKzx9OkjTW9rkUbk8NFG692sCSBS1r25YtLqrS6FCVgPCiqOw6qzO8bDw7yG9fF3dS27XuQ94Nu/Eu5a9s48D5cSo91U48i48AkvZvOLv2ur48Knm+Rr4tzxpw+HJVv086nx3lS2QJXRvXa9OVtcZ5EYJOA8WCTyjiPXRzVNh4EgpQt8Ia48nyL7P0gkCacvA8vFtWxdK7xXmQcmKRPeOTZ0rSH47sHtuRfxHdTSD+MRmxr56/je2kcAo9FNbf15U/ie4nANgHjwTadcX33f1Fd40EgSNkCu96DDn0/yK6YC3sV2BUH3od77Y7BCisyDkzSB4uHQQu+6+Tk5JqmHDW7L/IU0m1NbUzHo4GPRJbGIfBg6rOmHE34aGSJwDYB48E2nXF996umsSAdj6YYDwJB2irwqRQrTTmuLPj9IGonHUvA+3DMBwJz7vFeZByYpEdkzjA1rb2Y2nrepjWoY19bNMOQXTStSb9hjhjanCVgPMhiK/KipjXpxoMiu6vISjW9B837/aDIruq0Uk1x4H24U/bibl5kHJikFxcnvVSoae3F1NbzNq1BHfta+16CpLBCmtakf6yweqpOuQLGg3L7Zt+aNa1JNx7sKznf85vWpHs/6CgmCr2t9+FCO6bnahUZBybpPUdBIcXV115MdT1vfQ3qVNYWFRJGvVajvib933otXWFTEDAeTKEXL7ShvibdeHDBxb/tBervQd4P2tuVduYh9anHgffhQzTHe22RcWCSPt6AOqTma2sv4kZTXb+3tgY12jmVtfbRlNmltTXp0frXRZYI7CNgPNhHq+xz19akR1WNB4Eg7SWwtiY9rvR+EAgzTDvehycj4vm3vSuLjAOT9O2d5lsCBAgQIECAAAECBAgcT8CdCOwQMEnfAeRrAgQIECBAgAABAgQIjEFAHachYJI+jX7UCgIECBAgQIAAAQIECHQl4L49Cpik94itKAIECBAgQIAAAQIECBCoCtiuC5ik10XsEyBAgAABAgQIECBAgMD4BUbaApP0kXacahMgQIAAAQIECBAgQIDAMAJdlmqS3qWuexMgQIAAAQIECBAgQIAAgfYCC5P0PbCcSoAAAQIECBAgQIAAAQIEuhTobpLeZa3dmwABAgQIECBAgAABAgQITFBglJP0CfaDJhEgQIAAAQIECBAgQIAAgc7/7+4PhfEnMvPXM6/7fFx3d+Sccr+Zed1XMq9LdbzpJO8/T8277PGrPhj1PU1x5JORU3pbOhgbN0dO6Qtp/wh5iDhItj+v1f1rsX9H5B9FTunT8U/a/018HiN9J26Sys3J92Ree0js9V1m+m3+S2Y7U13j0tP0y9hKffe5+Ezpe/FP2r8/PodOh8T7EGNQss2J2UNiL3fcuygNTJn529XAiHusjXOx/5zIKf1v9bwDtg+Jg9znX+rHK1MjVjnq//7I6bfxtPh8ZuS0/e7V90f4zH4WRV0+HjnVed/8r8vl8s5Vjnu8K3K6x7fSsdi+KnLa/23ar+Ur4rvTFN/dEvljkV+SDsbn+yKn/YvT/hHyEHGQfpu570FjGg+yYy/ivv4e1Ol4EDF1VeTTmN1nO2LwkcgpnnNyfTy4Ne6VxoCXhsFJbJ+OD2n/CPmQPskt/pAy63Ewxffh9O71lmrMRb8/GjnF08vS8di+N3La/1Dar+QvVbb3id9747rPRt7nmsfPjXrkvh+ciYO412l8x/a251/fcRDV2Z26/l/SL48qvCMzvzLzupvjujdGzin3hszrXrX7ukVTfa6Ja6eehoiD5H1ZDfam2L898vMip/Tm+CftPyU+j5GujZukcnPyucxrD4m9vstMv81XZ7Yz1TUuPU3PiK3Ud7fEZ0ovin/S/svjc+h0SLwPMQYl25yYPST2jHuLxmdC6ovc51+6tj7uVce5+u9m6N9KmlynOu+br4+K73vN6vy6T9fPhUPGg9w4SL/N3Pcg40EEVwdpiDhIMd93vHdAN6lbDhEH6d0rdzwYYgw65vtByc+/nYHd9SR9ZwWccAQBtyBAgAABAgQIECBAgACBSQiYpE+iG7trhDsTIECAAAECBAgQIECAQH8CJun9WStpXcAeAQIECBAgQIAAAQIECNQETNJrIHanIKANBAgQIECAAAECBAgQGKeASfo4+02thxJQLgECBAgQIECAAAECBDoUMEnvENetCewj4FwCBAgQIECAAAECBAiYpIsBAtMX0EICBAgQIECAAAECBEYiYJI+ko5STQJlCqgVAQIECBAgQIAAAQLHFDBJP6amexEgcDwBdyJAgAABAgQIECAwQwGT9OE7/fnL5fJci/zs4auqBgQGE7ik+huJWlwfOTu5cHAB497gXaACBIoRMB4U0xUqQqAsgXj3uzxym3nSW+vnRUsujjzaZJI+fNe9PqpwvkW+Ls6RCMxV4MpoePV3clfsl5jUqZ2Aca+dk7MIzEHAeDCHXtZGAnkCN8Zl1fe/pu07Npx3aRwbbTJJH77rHo4qPLAl/yK+kwjMXeCxANj0O/l+HJ9JmlQzjXuT6k6NIXCQgPHgID4XE5iFwCPRyk3vgatjP9vy/e/iu9Elk/Thu+yuk5OTa5pyVO++yBKBuQs82PAbuXXuMEdpf/83Me71b65EAqUKGA9K7Rn1IlCOwD0N74GrOdRzt3yf/oeeclrSsiYm6S2hOjytaS3Wizss060JjE1gbU36hnVHLxhbg+ZS34Z2GvcaYBwmMEMB48EMO12TCeQIxPvfX0betEb9zJr06nlR1uj+lpFJevTawKlpLdZtA9dL8QRKEqivSa+vSXpnSZVVl50Cxxj3dhbiBAIERiFgPBhFN6kkgSIE/jZqUX8HTPub1qSn46s8ur9lZJIePT1wqq/F+snA9VE8gRIF0v9VabXuaNvnQyVWXp3OCBQ+7p2prwMECHQnYDzoztadCUxV4N+jYdX3wW1r0qvnjeZvGZmkRw8PnNbWYkVdPhpZIkBgXaBpTfpqLdLq8yPrl9krVGC+416hHaJaBAYUMB4MiK9oAiMV+EBtDfq2Nemrd8T0OZq/ZWSSPtLIVG0CBAgQIFAVsE2AAAECBAhMQ8AkfRr9qBUECBAgQKArAfclQIAAAQIEehQwSe8RW1EECBAgQIBAVcA2AQIECBAgUBcwSa+L2CdAgAABAgTGL6AFBAgQIEBgpAIm6SPtONUmQIAAAQIEhhFQKgECBAgQ6FLAJL1LXfcmQIAAAQIECLQXcCYBAgQIEFiYpAsCAgQIECBAgMDkBTSQAAECBMYiYJI+lp5STwIECBAgQIBAiQLqRIAAAQJHFTBJPyqnmxEgQIAAAQIECBxLwH0IECAwRwGT9Dn2ujYTIECAAAECBOYtoPUECBAoVqDrSfpD0fJPZOavZ16XyrvypPKfuM+tke+I/NJ0OD7fHzntPy3tHyE/9YB7fDDqcpriPp+MnNLb0sHYuDlySl9I+yPNQ8XBz2teX4v91O8/is+UPh3/pP3fxOcx0nfiJin+cvI9mdd+PAVHNcd9TuM7tp8ZObXx3dVzDtzOiveoxwsj59ika/5nuVzemZmviHJPU9zjlsgfi/ySdDA+3xc57V+c9o+QD4n3b0b5qb375q9kXpfKyY29Q8r8izA/7c+o+1WRU11+m47H9qOR0/7L0n4lf6OyfXp9y2NrcRD37zodEge5z7/UJ2+pekQj742cLD8Un++KnLa/VT3nie3zT3zu6/rlzOvujLrkxt4/HjCGfTvKraaunwtDxcHd0cjU1/vm3D5JsbdvWavzc8eD7NiLmL0xfDpM67eOeP1q5LUUZ7R6N43z0nviymqfz8/HtfXxYG1sje9Px4cwqf7276/tV7/btn1In/Q+BkUbe42D8B5iPEgxkzsvumQtaHvYCaNLol9OsNtzxAAAEABJREFUYyz2274fHBJ7fcdBNGt36nqSfnlU4R2Z+ZWZ16XyLotrq+mm2Lk98vMip/Tm+CftPyU+pe4F5hIH1wZlir+cfC7z2tviunqqxvcz4ssU67fE59BpLnFwSDtviE7KiZ9XZV6XysqNvSHKvP6AdtafC3GrTtMhcZD7/Et98sZoVerXffOY4mDTuBfNzkpdvx+Ig8ViVywOEXvXZEXLcS9qG3uvjWKfNNztuTr35rgudzyYy7Oo7zgYYjxI8VB//rWNvQih3lP6L5NTnffN6fm37zWr8/uOg1aoXU/SW1XCSQQIECBAgAABAgQIDCegZAIEyhEwSS+nL9SEAAECBAgQIECAwNQEtIcAgT0FTNL3BHM6AQIECBAgQIAAAQIlCKgDgWkKmKRPs1+1igABAgQIECBAgACBXAHXERhQwCR9QHxFEyBAgAABAgQIECAwLwGtJbBLwCR9l5DvCRAgQIAAAQIECBAgUL6AGk5EwCR9Ih2pGQQIECBAgAABAgQIEOhGwF37FDBJ71NbWQQIECBAgAABAgQIECDwpICtMwIm6WdIHCBAgAABAgQIECBAgACBsQuMtf4m6WPtOfUmQIAAgX0Erlsul+da5Iv2ualzhxeIPv2DyG369k1x3q2RT8+N2j8rsjQ/gedX42DL9hDjwY3V+kTX/FFkqRuBtnHw7G6Kd9dCBHLjoNPqm6R3yuvmBAgQIFCIwIejHudb5KfHOdK4BP4kqtumbz8T590duXruK2Jfmp/AG6LJ1Tho2h5iPPhirW5/FvtSNwKvj9s29X31+HVxnjRdgQLjYLEwSZ9uwGkZAQIECDwp8MPYfGBL/nV8J41b4LGo/rY+fjC+/0HkTec8Gsel+Qg8HE3dFAerY0OMB99tqNOv4rjUjcCuOPhFN8W6a2ECRcZBZ5P0wvBVhwABAgTmLXDbycnJNU05aB6JLI1b4MdN/fvE8RfG59WRN8XBfeNuutrvKfCphjh4PDbiXr2PB1Gf10R+vPzqZ9Tlp5GlbgTuqlrXt6NI40IgzCAVGQdjnKTPIFY0kQABAgSOLNC0Jt1awyNDD3275XJ5eeTTdeeV7TNr0ivfPX5+1P3iyNL0BZrWoA4xHlxdj8PqfnSFNemB0FFqioMXd1Se25YpUGQcmKSvBYsdAgQIEJioQNOadGsNp9fhN0aTqutJV9ub1qSvvlt9XhrXStMXaFqTPsR48N7gXsXfpk9r0gOoo9S0Fvm2jspz2zIFiowDk/S+gkU5BAgQIDCkQH1NurWGQ/ZGP2Wn/8vyao1x+ty2Jj19X82/66eKShlIoL4GdYjx4MfR9mrMNW1bkx5QHaV6HPyko3LctmyBIuPAJL3soGlVOycRIECAwE6BtTXpcba1hoEw8XRPbY3ptjXp9bXA6Y/QTZxn1s1bW5MeEr2PBxGbH4hcj7sz+1E3a9IDoaO0thY5yvhoZGl+AkXGgUn6/AJxnxY7lwABAgQIECBAgAABAgR6FDBJ7xFbUVUB2wQIECBAgAABAgQIECBQFzBJr4vYH7+AFhAgQIAAAQIECBAgQGCkAibpI+041R5GQKkECBAgQIAAAQIECBDoUsAkvUtd9ybQXsCZBAgQIECAAAECBAgQWJikCwICkxfQQAIECBAgQIAAAQIExiJgkj6WnlJPAiUKqBMBAgQIECBAgAABAkcVMEk/KqebESBwLAH3IUCAAAECBAgQIDBHAZP0Ofa6NhOYt4DWEyBAgAABAgQIEChWwCS92K5RMQIExiegxgQIECBAgAABAgQOE+h0kn5ycvLVyGspqntr5DsivzR9EZ/vj5z2n5b2K/mSyva+m9+Oe1bT12InlfGj+Ezp0/FP2v9NfEodC0TnzSIOop3vibyWgvY0vmP7mZFT3L177aTDdv447llP1fj+ZXyZyvxcfA6aoplziYND2hlMDWn74adu/7qTb4co86IDWtLrcyHqeUgcHPL8i6J7TUPEQX3cq49z34vBLo1798fnoCl6QhwEQkfpkNj7YC0win1PDLu/inyaot5r7xKxf23kFO+vOz1puI1D+iS31oeUWY+D+thRj4ugzk/RwKHGg16ff/lCi0UYraXFYrEW37G/No+snDyaOIg2tEqdTtIbanBTHL898vMip/Tm+CftPyU+u0pDlNlVW6Zy3yH6ZIgyq/H9jOi8FOu3xGeXaYgyc9szRJ/MpczWfTLTE8XBdDq+Pra+KJqWxtqXx2eJaYjYK9GhpDqNqU/GFu8l9fOuutTHjnpc7Lo+5/t6GdV3uJz7tblmiDLb1GvTOUP0yRBlnmn7EJP0M5VwgAABAgQmKaBRBAgQIECAAAECewqYpO8J5nQCBAgQKEFAHQgQIECAAAEC0xQwSZ9mv2oVAQIECOQKuI4AAQIECBAgMKCASfqA+IomQIAAgXkJaC0BAgQIECBAYJeASfouId8TIECAAIHyBdSQAAECBAgQmIiASfpEOlIzCBAgQIBANwLuSoAAAQIECPQpYJLep7ayCBAgQIAAgScFbBEgQIAAAQJnBEzSz5A4QIAAAQIECIxdQP0JECBAgMBYBUzSx9pz6k2AAAECBAgMIaBMAgQIECDQqUBJk/Qbl8vluUp+a2W7enzX9pviulsjn54Xgs+KLI1DYA5x8IfV+Hxi++1PfJ7Gbcv9M7+T6OaLI489zSEOUh/V2/l3Lfu9Hidn4mCP+xwt9noo8z17lFE1Kv25UI+D3P58Z/isPf9iv+qwbXu0cRA/pOsjTyHduFwe5T1oLnGQ+ztJ48FavEfwTOE98U9rv/fUztzxYJbPooiDF0QuJR3ruXAmDqKBU4j3q2vxnjsepOdifTwoIg5KmqR/MYLmfCX/Q2W7enzX9mfiursjV897RexL4xCYQxxcEV1Rjc+0/YkNx9LxXfmODdddGsfGnuYQB6mPjtXOTXGwK3ZW3x8z9lb33PWZW+bfB9que2/6vvTnwrHi4OPhU3/+bfLYdCy3T4aIvXoc3BXtnkLqNg4Wi039Xj82pjjIjb00HvxTBEy17VN4T/zrWptSO3PHg9x38Nw+SX1RQuy9MwxLSccaDzbFwRTi/b3RUSluVvmYsVdEHJQwSf9uID+wIf/nhmObzqsfezCu+0Hk+vG0/2gcl8oUmEMc/DroUxxuyj/d8t2m81fHfrblut/Fd2NLc4iD1CdN7fyv+HLVt/t8bouDXffpIva6KvO/M31KfS40xUHu8y/FQdPzr6s+SWXuunfT97mx1xQH34/4GGMafRwE+hBxkFtmGg/+I+q8KS7H+J7Y9HtI7cwdD+b+LHoo4mOodOzxYFscjDHefxwds+m3mzsepHs1PYuGjIPF4JP0k5OT10S+ZkP+8w3HNp1XP/bCuO7qyPXjaf++6FipQIHor8nHQbTx4cgpDjflK7d8t+n81bHnbrnusQK7emuVoi2Tj4MEsKWdl8Z3q77d53NbHOy6Txex11WZl2X6FPlciLYcO94vj3s2Pf+66pMhYq8pDm5Nv6+x5egzcXBy0hSf247nxl4aD54T7pvuPbr3xGjHlyNvaktqZ+54MPdn0UeGGkeiL489HmyLgzHG+wfCaFO8544H6V5N70GDxUGKvyEn6fW1BGlNQDXnri04s/aitmbhXDR8Cmt2oxmTSHOJg/raomqsp+219TD1mN2yv/V3EhEylrWac4mDXe2c5TrALfGdfhvVfLQ16fUy47fS53NhVxxs/V3X617Zn8ta5K1xEH1ZxHrCqMeuJA4u/C2iTp5/ld9FdQxJ2+k98e3L5dr6/3T8NEfH9TkeRHFZadPftzltQ7Q/tdOa9AsxVnWpbm+NveiVPtdudzUe7IyDaOcY4r3+Nxeq/Zi2c5+b6dqS4iC640IacpJeX0uwWlOw+sxdD7Np7cXqnqvPKazZvdCD4/93LnFQX1u0isXVZ1drscayVnMucdBVO4+5FmsVk7s+hyizvhZ5Vx1X35f2XOgqDua6Jn3Vz6vPItYTtng8i4ML6+S7ev6t4qH+mcaD+pr0+jmHvSe26PwjnLLp79tU25HaaU36hRirulS3d8Ven2u3uxoP2sTBGOK9/jcXqv2Ytrt8J+kzDk6HhiEm6U1rCdKagGrOXZO3be1F9f5pe4xrdk87b+Qbc4mDprVFKf6quWk9TPWcTdtt1+CUulZzLnHQtp1zXwe4Kcarx5rWXlbP2bRdynOhbRzkPv/SeJC7BrXrMWhTv+SW2TYOBl1PuOUZLQ4Wi2o85MZBivfqfdpup/GgaU16/R7FvSdGXG37+zbV+qd25o4HnkXrMdrl2u2ux4N94qDEeG873ueOB+k303YM6jIO4qe9nnqfpJ+cnDStJUhrAqq5izXp1fun7dGt2V3vvvHuzSUOop1Na4tS/FVz03qY6jmbttuuwSlyrWb4zGI82KOdc18HuCnGq8cuC8vqftvtbWvy6vfo7LkQde863ue+Jr3el4OuJ2x6QouDM+vPu37+1eMijQdNa9Lr53Y2HjTFx67jET/b/r5Ntf6pnfusSa9e61l0shanna3djv7s+rmwTxyUGO9Nf3OhGq9pu+37cDq3ntuOQZ3Fwabffe+T9E2VcIwAAQIECBAgQIAAgSkKaBMBAvsKmKTvK+Z8AgQIECBAgAABAgSGF1ADAhMVMEmfaMdqFgECBAgQIECAAAECeQKuIjCkgEn6kPrKJkCAAAECBAgQIEBgTgLaSmCngEn6TiInECBAgAABAgQIECBAoHQB9ZuKgEn6VHpSOwgQIECAAAECBAgQINCFgHv2KmCS3iu3wggQIECAAAECBAgQIEBgJeDzrIBJ+lkTRwgQIECAAAECBAgQIEBg3AKjrb1J+mi7TsUJECBAgAABAgQIECBAoH+Bbks0Se/W190JECBAgAABAgQIECBAgEA7gTjLJD0QJAIECBAgQIAAAQIECBAgUIJAV5P0EtqmDgQIECBAgAABAgQIECBAYFQCI5ykj8pXZQkQIECAAAECBAgQIECAQGsBk/QqlW0CBAgQIECAAAECBAgQIDCggEl6T/iKIUCAAAECBAgQIECAAAECuwRM0ncJlf+9GhIgQIAAAQIECBAgQIDARARM0ifSkd00w10JECBAgAABAgQIECBAoE8Bk/Q+tZX1pIAtAgQIECBAgAABAgQIEDgjYJJ+hsSBsQuoPwECBAgQIECAAAECBMYqYJI+1p5T7yEElEmAAAECBAgQIECAAIFOBUzSO+V1cwJtBZxHgAABAgQIECBAgACBxcIkXRQQmLqA9hEgQIAAAQIECBAgMBoBk/TRdJWKEihPQI0IECBAgAABAgQIEDiugEn6cT3djQCB4wi4CwECBAgQIECAAIFZCpikz7LbNZrAnAW0nQABAgQIECBAgEC5Aibp5faNmhEgMDYB9SVAgAABAgQIECBwoIBJ+oGALidAgEAfAsogQIAAAQIECBCYh4BJ+jz6WSsJECDQJOA4AQIECBAgQIBAQYHMil8AAAD8SURBVAIm6QV1hqoQIEBgWgJaQ4AAAQIECBAgsK+ASfq+Ys4nQIAAgeEF1IAAAQIECBAgMFEBk/SJdqxmESBAgECegKsIECBAgAABAkMKmKQPqa9sAgQIEJiTgLYSIECAAAECBHYKmKTvJHICAQIECBAoXUD9CBAgQIAAgakImKRPpSe1gwABAgQIdCHgngQIECBAgECvAibpvXIrjAABAgQIEFgJ+CRAgAABAgTOCpiknzVxhAABAgQIEBi3gNoTIECAAIHRCpikj7brVJwAAQIECBDoX0CJBAgQIECgWwGT9G593Z0AAQIECBAg0E7AWQQIECBAYLFY/D8AAAD//+kLXVIAAAAGSURBVAMAaGDV6ry3RZ4AAAAASUVORK5CYII="
                className="object-contain size-full"
                alt="Firedeck"
              />
            </div>
      
            <p className="font-bold text-white text-center">Welcome to Firedeck</p>
            <p className="text-center text-white mt-2">
              Get started by editing{" "}
              <code className="px-1 py-0.5 bg-gray-800 rounded-lg text-sm font-semibold">
                modules/main/client/pages/index-page.tsx
              </code>
            </p>
          </div>
        );
      }`,
    },

    // "modules/main/server/hello.ts": {
    //   content: `
    //   import { defineFunction } from "firedeck";
    //
    //   export default defineFunction({
    //     async handler() {
    //       console.log("Hello Firedeck");
    //     },
    //   });`,
    // },

    "modules/shared/client/components/index.tsx": {
      content: ``,
    },
  };
}

export function generateModuleFileTree(args: {
  name: string;
  components: "all" | "client" | "server";
}): FileTree {
  let contents: FileTree = {};

  if (["all", "client"].includes(args.components)) {
    contents = {
      ...contents,
      [`modules/${args.name}/client/index.html`]: {
        content: `
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${args.name}</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/index.tsx"></script>
          </body>
        </html>`,
      },

      [`modules/${args.name}/client/index.css`]: {
        content: '@source "./pages/**/*.tsx";',
      },

      [`modules/${args.name}/client/index.tsx`]: {
        content: `
        import type { ReactNode } from "react";
        
        export default function (appRouter: ReactNode) {
          return appRouter;
        }`,
      },

      [`modules/${args.name}/client/pages/index-page.tsx`]: {
        content: `
          export default function IndexPage() {
            return (
              <div className="grid place-items-center">
                <p>Module: ${args.name} Home</p>
              </div>
            );
          }`,
      },
    };
  }

  // if (["all", "server"].includes(args.components)) {
  //   contents[`modules/${args.name}/server/hello.ts`] = {
  //     content: `
  //     import { defineFunction } from "firedeck";
  //
  //     export default defineFunction({
  //       async handler() {
  //         console.log("Hello Firedeck");
  //       },
  //     });`,
  //   };
  // }

  return contents;
}

export function generateRuntimeFileTree(): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "firedeck-runtime",
        "version": "0.0.0",
        "private": true,
        "type": "module",
        "packageManager": "yarn@1.22.22",
        "workspaces": [
          "modules/*"
        ],
        "scripts": {
          "dev": "turbo dev",
          "build": "turbo build"
        },
        "dependencies": {
          "turbo": "^2.10.4",
        }
      }`,
    },

    "turbo.json": {
      content: `
      {
        "$schema": "https://turbo.build/schema.json",
        "tasks": {
          "dev": {
            "persistent": true,
            "cache": false
          },
          "build": {
            "dependsOn": ["^build"],
            "outputs": ["apps/**/dist/**", "apps/**/lib/**", "apps/**/bin/**"]
          },
          "//#emulate": {
            "persistent": true
          }
        }
      }`,
    },

    ".gitignore": {
      content: [
        ".idea",
        ".turbo",
        ".firebase",
        "node_modules",
        "dist",
        ".env",
        ".env.local",
        "*.log",
        "firebase-export-*",
      ].join("\n"),
      extension: "md",
    },
  };
}

export function generateRuntimeClientFileTree(args: { clientName: string }): FileTree {
  return {
    "package.json": {
      content: `
      {
        "name": "${args.clientName}",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "tsc -b && vite build",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^19.2.7",
          "react-dom": "^19.2.7",
          "react-router": "^8.2.0"
        },
        "devDependencies": {
          "@types/node": "^24.13.2",
          "@types/react": "^19.2.17",
          "@types/react-dom": "^19.2.3",
          "@vitejs/plugin-react": "^6.0.3",
          "typescript": "~6.0.2",
          "typescript-eslint": "^8.62.0",
          "vite": "^8.1.1"
        }
      }`,
    },

    "vite.config.ts": {
      content: `
      import { defineConfig } from "vite";
      import react from "@vitejs/plugin-react";
      import tailwindcss from "@tailwindcss/vite";
      import { resolve } from "node:path";
      
      const __dirname = import.meta.dirname;
      
      // https://vite.dev/config/
      export default defineConfig({
        plugins: [react(), tailwindcss()],
        resolve: {
          alias: {
            "@": resolve(__dirname, "../../../../modules"),
          },
        }
      })`,
    },

    "tsconfig.app.json": {
      content: `
      {
        "compilerOptions": {
          "target": "ES2020",
          "useDefineForClassFields": true,
          "lib": ["ES2020", "DOM", "DOM.Iterable"],
          "module": "ESNext",
          "skipLibCheck": true,
          "moduleResolution": "bundler",
          "allowImportingTsExtensions": true,
          "isolatedModules": true,
          "moduleDetection": "force",
          "noEmit": true,
          "jsx": "react-jsx",
          "strict": true,
          "noUnusedParameters": true,
          "noFallthroughCasesInSwitch": true,
          "rootDir": "../../../../",
          "paths": {
            "@/*": ["../../../../modules/*"],
          }
        },
        "include": ["./src", "./global.d.ts", "../../../../modules"]
      }`,
    },

    "tsconfig.node.json": {
      content: `
      {
        "compilerOptions": {
          "target": "es2023",
          "lib": ["ES2023"],
          "types": ["node"],
          "skipLibCheck": true,
      
          /* Bundler mode */
          "module": "nodenext",
          "allowImportingTsExtensions": true,
          "verbatimModuleSyntax": true,
          "moduleDetection": "force",
          "noEmit": true,
      
          /* Linting */
          "noUnusedLocals": true,
          "noUnusedParameters": true,
          "erasableSyntaxOnly": true,
          "noFallthroughCasesInSwitch": true
        },
        "include": ["vite.config.ts"]
      }`,
    },

    "tsconfig.json": {
      content: `
      {
        "files": [],
        "references": [
          { "path": "./tsconfig.app.json" },
          { "path": "./tsconfig.node.json" }
        ]
      }`,
    },

    "global.d.ts": {
      content: 'declare module "*.css";',
    },

    ".gitignore": {
      content: [
        "# Logs",
        "logs",
        "*.log",
        "npm-debug.log*",
        "yarn-debug.log*",
        "yarn-error.log*",
        "pnpm-debug.log*",
        "lerna-debug.log*",
        "node_modules",
        "dist",
        "dist-ssr",
        "*.local",
        "# Editor directories and files",
        ".vscode/*",
        "!.vscode/extensions.json",
        ".idea",
        ".DS_Store",
        "*.suo",
        "*.ntvs*",
        "*.njsproj",
        "*.sln",
        "*.sw?",
      ].join("\n"),
      extension: "md",
    },

    "index.html": {
      content: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${args.clientName}</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/index.tsx"></script>
        </body>
      </html>`,
    },

    "public/favicon.svg": {
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="46" fill="none" viewBox="0 0 48 46"><path fill="#863bff" d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" style="fill:#863bff;fill:color(display-p3 .5252 .23 1);fill-opacity:1"/><mask id="a" width="48" height="46" x="0" y="0" maskUnits="userSpaceOnUse" style="mask-type:alpha"><path fill="#000" d="M25.842 44.938c-.664.844-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.183c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.498 0-3.579-1.842-3.579H1.133c-.92 0-1.456-1.04-.92-1.787L9.91.473c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.578 1.842 3.578h11.377c.943 0 1.473 1.088.89 1.832L25.843 44.94z" style="fill:#000;fill-opacity:1"/></mask><g mask="url(#a)"><g filter="url(#b)"><ellipse cx="5.508" cy="14.704" fill="#ede6ff" rx="5.508" ry="14.704" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -4.47 31.516)"/></g><g filter="url(#c)"><ellipse cx="10.399" cy="29.851" fill="#ede6ff" rx="10.399" ry="29.851" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -39.328 7.883)"/></g><g filter="url(#d)"><ellipse cx="5.508" cy="30.487" fill="#7e14ff" rx="5.508" ry="30.487" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -25.913 -14.639)scale(1 -1)"/></g><g filter="url(#e)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.814 -32.644 -3.334)scale(1 -1)"/></g><g filter="url(#f)"><ellipse cx="5.508" cy="30.599" fill="#7e14ff" rx="5.508" ry="30.599" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="matrix(.00324 1 1 -.00324 -34.34 30.47)"/></g><g filter="url(#g)"><ellipse cx="14.072" cy="22.078" fill="#ede6ff" rx="14.072" ry="22.078" style="fill:#ede6ff;fill:color(display-p3 .9275 .9033 1);fill-opacity:1" transform="rotate(93.35 24.506 48.493)scale(-1 1)"/></g><g filter="url(#h)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#i)"><ellipse cx="3.47" cy="21.501" fill="#7e14ff" rx="3.47" ry="21.501" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(89.009 28.708 47.59)scale(-1 1)"/></g><g filter="url(#j)"><ellipse cx=".387" cy="8.972" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(39.51 .387 8.972)"/></g><g filter="url(#k)"><ellipse cx="47.523" cy="-6.092" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 47.523 -6.092)"/></g><g filter="url(#l)"><ellipse cx="41.412" cy="6.333" fill="#47bfff" rx="5.971" ry="9.665" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 41.412 6.333)"/></g><g filter="url(#m)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#n)"><ellipse cx="-1.879" cy="38.332" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 -1.88 38.332)"/></g><g filter="url(#o)"><ellipse cx="35.651" cy="29.907" fill="#7e14ff" rx="4.407" ry="29.108" style="fill:#7e14ff;fill:color(display-p3 .4922 .0767 1);fill-opacity:1" transform="rotate(37.892 35.651 29.907)"/></g><g filter="url(#p)"><ellipse cx="38.418" cy="32.4" fill="#47bfff" rx="5.971" ry="15.297" style="fill:#47bfff;fill:color(display-p3 .2799 .748 1);fill-opacity:1" transform="rotate(37.892 38.418 32.4)"/></g></g><defs><filter id="b" width="60.045" height="41.654" x="-19.77" y="16.149" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="c" width="90.34" height="51.437" x="-54.613" y="-7.533" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="d" width="79.355" height="29.4" x="-49.64" y="2.03" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="e" width="79.579" height="29.4" x="-45.045" y="20.029" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="f" width="79.579" height="29.4" x="-43.513" y="21.178" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="g" width="74.749" height="58.852" x="15.756" y="-17.901" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="7.659"/></filter><filter id="h" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="i" width="61.377" height="25.362" x="23.548" y="2.284" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="j" width="56.045" height="63.649" x="-27.636" y="-22.853" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="k" width="54.814" height="64.646" x="20.116" y="-38.415" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="l" width="33.541" height="35.313" x="24.641" y="-11.323" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="m" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="n" width="54.814" height="64.646" x="-29.286" y="6.009" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="o" width="54.814" height="64.646" x="8.244" y="-2.416" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter><filter id="p" width="39.409" height="43.623" x="18.713" y="10.588" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur result="effect1_foregroundBlur_2002_17158" stdDeviation="4.596"/></filter></defs></svg>',
      extension: "html",
    },

    "src/index.tsx": {
      content: `
      import "./index.css";
      import { StrictMode } from "react";
      import { createRoot } from "react-dom/client";
      import { RouterProvider } from "react-router";
      import customizer from "@/${args.clientName}/client/index.tsx";
      import router from "./router.tsx";
      
      createRoot(document.getElementById("root")!).render(
        <StrictMode>
          {customizer(<RouterProvider router={router} />)}
        </StrictMode>,
      );`,
    },

    "src/index.css": {
      content: `
      @import "tailwindcss";
      @import "../../../../../modules/${args.clientName}/client/index.css";
      `,
    },
  };
}
