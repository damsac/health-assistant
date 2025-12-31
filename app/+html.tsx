import { ScrollViewStyleReset } from 'expo-router/html';

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

const tamaguiReset = `
html, body, #root {
  height: 100%;
}
input, textarea, select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  outline: none;
}
input:focus, textarea:focus, select:focus {
  outline: none;
}
/* Ensure inputs can receive pointer events */
input, textarea, button, select {
  pointer-events: auto !important;
}
/* Fix Tamagui Input component on web */
[data-tamagui-web="true"] input,
[data-tamagui-web="true"] textarea {
  pointer-events: auto !important;
}
`;

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Tamagui CSS reset for proper web input handling */}
        <style dangerouslySetInnerHTML={{ __html: tamaguiReset }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
