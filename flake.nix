{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system: f {
        pkgs = import nixpkgs { inherit system; };
      });
    in
    {
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            bun
            nodejs_22
            typescript
            biome
            git
            watchman
          ];

          env = {
            EXPO_NO_TELEMETRY = "1";
          };

          shellHook = ''
            echo ""
            echo "🏥 AI Health Consultant Development Environment"
            echo "================================================"
            echo ""
            echo "Available commands:"
            echo "  bun install     - Install dependencies"
            echo "  bun run dev     - Start Supabase + Expo"
            echo "  bun run dev:web - Start Supabase + Expo (web only)"
            echo "  bun run lint    - Lint with Biome"
            echo "  bun run format  - Format with Biome"
            echo "  bun run check   - Check with Biome (lint + format)"
            echo ""
            echo "Node: $(node --version) | Bun: $(bun --version)"
            echo ""
          '';
        };
      });
    };
}
