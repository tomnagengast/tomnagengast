import Markdown from "react-markdown";
import { useState, useEffect } from "react";

function App() {
  const [showBlob, setShowBlob] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  useEffect(() => {
    // Preload all GIFs
    const gifs = [
      "/gifs/typing-cat.gif",
      "/gifs/costanza-busy.gif", 
      "/gifs/old-dance.gif",
      "/gifs/static.gif"
    ];
    
    // Preload SVGs
    const svgs = [
      "https://unpkg.com/simple-icons@v15/icons/github.svg"
    ];
    
    [...gifs, ...svgs].forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const getBlobImage = () => {
    switch (hoveredIcon) {
      case "github":
        return "/gifs/typing-cat.gif";
      case "linkedin":
        return "/gifs/costanza-busy.gif";
      case "email":
        return "/gifs/old-dance.gif";
      default:
        return "/gifs/static.gif";
    }
  };
  return (
    <div className="container mx-auto max-w-xl px-4 lg:px-0">
      <div className="mt-24">
        <a href="https://tomnagengast.com/">
          <div className="flex justify-between items-center text-xl underline text-slate-900">
            Tom Nagengast
          </div>
        </a>

        {/* <div className="text-6xl font-bold mt-4 title">README</div> */}

        <div className="text-xl my-8 space-y-4">
          <Markdown>
            {`Currently [slingin' bits](https://cable.tech/) and [stompin' grapes](https://bajkawine.com/).`}
          </Markdown>
          <Markdown>
            {`Previously piping data with the fine folks at
            [Replit](https://blog.replit.com/how-replit-makes-sense-of-code-at-scale-ai-data/),
            Replicated,
            [Netlify](https://www.netlify.com/blog/2021/04/08/how-the-netlify-data-team-uses-census-for-operational-analytics/)
            and Mindbody.
            `}
          </Markdown>
        </div>

        <div className="flex justify-center mt-10">
          <svg
            width="237"
            height="12"
            viewBox="0 0 330 20"
            className="-rotate-2"
            fill="currentColor"
          >
            <path
              d="M122.656724,401 C181.615893,401.136151 240.713029,402.589889 299.523408,404.330861 C306.004291,404.523229 312.505914,405.071345 318.990403,405.348917 C320.117592,405.39635 323.828296,404.924654 324.664219,406.133321 C326.024059,408.103553 322.910314,410.108043 321.443165,411.006637 C316.395165,414.096819 309.713192,413.557486 303.992485,413.752489 C296.099461,414.01952 288.201928,414.050264 280.305297,413.940465 C252.867727,413.559243 225.418435,411.473942 198.039479,409.851552 C181.174035,408.852821 164.256289,408.24146 147.3674,407.744291 C139.030714,407.49922 130.687716,407.363069 122.351932,407.088132 C120.101162,407.014347 116,407.716182 116,404.757759 C116,401.675483 120.497933,401.166894 122.656724,401"
              transform="translate(-171, -401) scale(1.5, 1)"
            />
          </svg>
        </div>

        <div className="social-container">
          <ul className="flex items-center justify-center mt-8 space-x-4 text-secondary-600">
            <li
              onMouseEnter={() => {
                setShowBlob(true);
                setHoveredIcon("github");
              }}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <a
                href="https://github.com/tomnagengast"
                className="hover:text-brand transition-colors"
              >
                <img
                  height="20"
                  width="20"
                  src="https://unpkg.com/simple-icons@v15/icons/github.svg"
                  alt="GitHub"
                />
              </a>
            </li>
            <li
              onMouseEnter={() => {
                setShowBlob(true);
                setHoveredIcon("linkedin");
              }}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <a
                href="https://www.linkedin.com/in/tomnagengast"
                className="hover:text-brand transition-colors"
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  height="20"
                  width="20"
                >
                  <title>LinkedIn</title>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </li>
            <li
              onMouseEnter={() => {
                setShowBlob(true);
                setHoveredIcon("email");
              }}
              onMouseLeave={() => setHoveredIcon(null)}
            >
              <a
                href="mailto:tnagengast@gmail.com"
                className="hover:text-brand transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="#000"
                  height="20"
                  width="20"
                >
                  <title>Email Me!</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
              </a>
            </li>
          </ul>

          <div
            className={`h-40 w-40 flex justify-center mx-auto mt-6 social-gifs relative transition-opacity duration-100 ${
              showBlob ? "opacity-100" : "opacity-0"
            }`}
          >
            <svg viewBox="0 0 170 170">
              <mask id="blob1" className="mask-type-alpha fill-slate-700/70">
                <path
                  fill="#E8DAFF"
                  d="M39.8,-53.1C50.6,-38.4,57.6,-24.9,62.1,-9.5C66.5,5.9,68.3,23.2,61.7,36.7C55.2,50.2,40.2,59.8,23.2,67.8C6.2,75.8,-13,82.1,-29.1,77.4C-45.3,72.6,-58.3,56.9,-67.4,39.7C-76.5,22.4,-81.5,3.6,-77.3,-12.6C-73.2,-28.7,-59.9,-42.1,-45.5,-56.1C-31.1,-70.2,-15.5,-84.8,-0.5,-84.2C14.5,-83.6,29,-67.7,39.8,-53.1Z"
                  transform="translate(90 88)"
                />
              </mask>
              <image
                href={getBlobImage()}
                height="100%"
                width="100%"
                mask="url(#blob1)"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
