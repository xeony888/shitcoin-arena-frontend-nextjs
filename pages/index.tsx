import BasicButton from "@/components/BasicButton";
import CustomDropdown from "@/components/CustomDropdown";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import bs58 from "bs58";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import dynamic from "next/dynamic";
import TransactionFailure from "@/components/TransactionFailure";
import TransactionPending from "@/components/TransactionPending";
import TransactionSuccess from "@/components/TransactionSuccess";
import Select from "@/components/Select";
import ServerDropdown from "@/components/ServerDropdown";
import { shortenAddress, shortenShortenAddress } from "@/components/utils";

let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;
const ships = [
  {
    src: "/space-fight/spaceship.png",
    name: "Spaceship 0",
    price: 0.01
  },
  {
    src: "/space-fight/spaceship.png",
    name: "Spaceship 1",
    price: 0.05
  },
  {
    src: "/space-fight/spaceship.png",
    name: "Spaceship 2",
    price: 0.1
  },
  {
    src: "/space-fight/spaceship.png",
    name: "Spaceship",
    price: 0.5
  },
  {
    src: "/space-fight/spaceship.png",
    name: "Spaceship",
    price: 1
  },
];
let socket: Socket;
const message = "Approve this message to sign in";
const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);
const imgMap: Map<string, HTMLImageElement> = new Map<string, HTMLImageElement>();
const createImage = (src: string): HTMLImageElement => {
  const img = document.createElement("img");
  img.src = src;
  return img;
};
const MAX_HEALTH = 15;
let backgroundImage: HTMLImageElement;
const down: string[] = [];
let mousePos: [number, number] | undefined;
const powerUpKeys: string[] = []; //["z", "x", "c", "v", "b"];
let ran = 0;
export default function Home() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedShip, setSelectedShip] = useState<any>(ships[0]);
  const [luckAmount, setLuckAmount] = useState<number>(0);
  const [selectedCoin, setSelectedCoin] = useState<any>();
  const [signature, setSignature] = useState<string>("");
  const { publicKey, signMessage, signTransaction } = useWallet();
  const [gameMessages, setGameMessages] = useState<string[][]>([]);
  const [mainMessages, setMainMessages] = useState<Map<number, string>>(new Map<number, string>());
  const [succeededTransaction, setSucceededTransaction] = useState<boolean>(false);
  const [failedTransaction, setFailedTransaction] = useState<boolean>(false);
  const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<{ address: string, points: number; }[]>([]);
  const [inTop5, setInTop5] = useState<boolean>(false);
  const [me, setMe] = useState<{ address: string, points: number; } | null>(null);
  const [gameMode, setGameMode] = useState<string>("Teams");
  const [servers, setServers] = useState<any[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [killedBy, setKilledBy] = useState<string>("");
  const [coins, setCoins] = useState<any[]>([]);
  const [tokenLeaderboard, setTokenLeaderboard] = useState<any[]>([]);
  const [myToken, setMyToken] = useState<any>();
  const [tokenInTop5, setTokenInTop5] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/servers`).then(async (res) => {
      const json = await res.json();
      setServers(json);
    });
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tokens`).then(async (res) => {
      const json = await res.json();
      setCoins(json.map((j: any) => j[1]));
    });
  }, []);
  useEffect(() => {
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d") as CanvasRenderingContext2D;
    canvas.height = canvas.parentElement!.offsetHeight;
    canvas.width = canvas.parentElement!.offsetWidth;
    backgroundImage = createImage("/space-fight/background.png");
    imgMap.set("/space-fight/background.png", createImage("/space-fight/background.png"));
    imgMap.set("/space-fight/spaceship-red.png", createImage("/space-fight/spaceship-red.png"));
    imgMap.set("/space-fight/spaceship.png", createImage("/space-fight/spaceship.png"));
    imgMap.set("/explosions/explosion0.png", createImage("/explosions/explosion0.png"));
    imgMap.set("/explosions/explosion1.png", createImage("/explosions/explosion1.png"));
    imgMap.set("/explosions/explosion2.png", createImage("/explosions/explosion2.png"));
    imgMap.set("/explosions/explosion3.png", createImage("/explosions/explosion3.png"));
    imgMap.set("/explosions/explosion4.png", createImage("/explosions/explosion4.png"));
    imgMap.set("/asteroids/asteroid0.png", createImage("/asteroids/asteroid0.png"));
    imgMap.set("/asteroids/asteroid1.png", createImage("/asteroids/asteroid1.png"));
    imgMap.set("/asteroids/asteroid2.png", createImage("/asteroids/asteroid2.png"));
    imgMap.set("/asteroids/asteroid3.png", createImage("/asteroids/asteroid3.png"));
  }, []);
  useEffect(() => {
    let sendStateInterval: any;
    if (publicKey && signature) {
      document.addEventListener("mousemove", mousemove);
      document.addEventListener("touchmove", touchmove, { passive: false });
      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
      document.addEventListener("mousedown", mousedown);
      document.addEventListener("mouseup", mouseup);
      sendStateInterval = setInterval(move, 20);
    }
    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("touchmove", touchmove);
      document.removeEventListener("keyup", keyup);
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("mousedown", mousedown);
      document.removeEventListener("mouseup", mouseup);
      clearInterval(sendStateInterval);
    };
  }, [publicKey, signature]);
  const mousedown = () => {
    if (!down.includes(" ")) {
      down.push(" ");
    }
  };
  const mouseup = () => {
    if (down.includes(" ")) {
      down.splice(down.indexOf(" "), 1);
    }
  };
  const keydown = (event: KeyboardEvent) => {
    if (event.key == " ") {
      if (!down.includes(" ")) {
        down.push(" ");
      }
    } else if (event.key == "g") {
      if (!down.includes("g")) {
        down.push("g");
      }
    }
  };
  const keyup = (event: KeyboardEvent) => {
    if (event.key == " ") {
      if (down.includes(" ")) {
        down.splice(down.indexOf(" "), 1);
      }
    } else if (event.key == "g") {
      if (down.includes("g")) {
        down.splice(down.indexOf("g"), 1);
      }
    } else if (powerUpKeys.includes(event.key)) {
      document.getElementById(event.key)?.click();
    }
  };
  const move = () => {
    if (mousePos && publicKey && socket) {
      socket.emit("move", { pos: mousePos, address: publicKey.toString(), dimensions: [canvas.width, canvas.height], down });
    }
  };
  const mousemove = (event: MouseEvent) => {
    mousePos = adjustToCanvas(event.clientX, event.clientY);
  };
  const touchmove = (event: TouchEvent) => {
    mousePos = adjustToCanvas(event.touches[0].clientX, event.touches[0].clientY);
  };
  const adjustToCanvas = (x: number, y: number): [number, number] | undefined => {
    const canvasRect = canvas.getBoundingClientRect();
    const [adjX, adjY] = [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
    if (adjX > 0 && adjX < canvas.width && adjY > 0 && adjY < canvas.height) {
      return [x - canvasRect.left - window.scrollX, y - canvasRect.top - window.scrollY];
    }
  };
  useEffect(() => {
    if (publicKey && signMessage && !signature && !ran) {
      (async () => {
        ran = 1;
        const sig = localStorage.getItem(`arena_signature_${publicKey.toString()}`);
        if (sig) {
          setSignature(sig);
        } else {
          const m = new TextEncoder().encode(message);
          try {
            const sig = bs58.encode(await signMessage(m));
            localStorage.setItem(`arena_signature_${publicKey.toString()}`, sig);
            setSignature(sig);
          } catch (e) {
            console.error(e);
          }
        }
      })();
    }
  }, [publicKey, signMessage, signature]);
  const play = async () => {
    if (!publicKey || !signTransaction) {
      console.error("You need to connect your wallet");
      setError("You need to connect your wallet!");
      return;
    }
    if (!signature) {
      console.error("You need to sign in");
      setError("You need to sign in!");
      return;
    }
    if (!selectedCoin) {
      console.error("You need to select a coin");
      setError("You need to select a coin!");
      return;
    }
    if (!selectedShip) {
      console.error("You need to select a ship");
      setError("You need to select a ship");
      return;
    }
    let price = selectedShip.price + luckAmount / 100;
    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(process.env.NEXT_PUBLIC_HOLDER_ACCOUNT!),
        lamports: price * LAMPORTS_PER_SOL
      })
    );
    try {
      setSendingTransaction(true);
      const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      tx.feePayer = publicKey;
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      setSucceededTransaction(true);
      socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
        auth: {
          publicKey: publicKey.toString(),
          signature
        }
      });
      socket.connect();
      socket.on("gameState", draw);
      socket.on("receiveLeaderboard", receiveLeaderboard);
      socket.on("receiveMessages", receiveMessages);
      socket.on("receiveMainMessage", receiveMainMessage);
      socket.on("receiveTokenLeaderboard", receiveTokenLeaderboard);
      socket.on("dead", endgame);
      socket.emit("respawn", { selectedCoin, selectedShip, luckAmount });
      setIsPlaying(true);
    } catch (e) {
      console.error(e);
      setFailedTransaction(true);
    } finally {
      setSendingTransaction(false);
      setTimeout(() => {
        setFailedTransaction(false);
        setSucceededTransaction(false);
      }, 5000);
    }
  };
  const endgame = (killer: string) => {
    setKilledBy(killer === "Asteroid" ? killer : shortenAddress(killer));
    setTimeout(() => {
      setIsPlaying(false);
      setKilledBy("");
      if (socket) {
        socket.disconnect();
        socket.off("gameState", draw);
        socket.off("receiveLeaderboard", receiveLeaderboard);
        socket.off("receiveMessages", receiveMessages);
        socket.off("receiveMainMessage", receiveMainMessage);
        socket.off("receiveTokenLeaderboard", receiveTokenLeaderboard);
        socket = undefined as unknown as Socket;
      }
    }, 1500);
  };
  const draw = (data: any) => {
    let player = data.find((object: any) => object.address === publicKey!.toString());
    if (player) {
      resetCanvas([player.x, player.y]);
      for (const object of data) {
        if (object.address && object.address === player.address) {
          drawPlayer(player.x, player.y, player.angle, player.width, player.width, player.imgSrc, player.grapplePressed, player.grapplePosition, player.health);
        } else {
          drawObject(object.angle, object.x - player.x, object.y - player.y, object.width, object.height ?? object.width, object.imgSrc, object.health, object.color, object.teamColor, object.address);
        }
      }
    } else { }
  };
  const receiveMessages = (messages: string[][]) => {
    if (messages) {
      setGameMessages(messages);
    }
  };
  const receiveMainMessage = (message: string) => {
    const key = Date.now();
    setMainMessages(prev => {
      const newMap = new Map<number, string>(prev);
      newMap.set(key, message);
      return newMap;
    });
    setTimeout(() => {
      setMainMessages(prev => {
        const newMap = new Map<number, string>(prev);
        newMap.delete(key);
        return newMap;
      });
    }, 1500);
  };
  const receiveTokenLeaderboard = (leaderboard: any[]) => {
    const l = leaderboard.map(l => l[1]).sort((a, b) => b.points - a.points).slice(0, 5);
    const myToken = leaderboard.find((l) => l[1].address === selectedCoin.address);
    setTokenInTop5(myToken && myToken[1].points >= l[l.length - 1].points);
    setMyToken(myToken[1]);
    setTokenLeaderboard(l);
  };
  const receiveLeaderboard = (leaderboard: { address: string, points: number; }[]) => {
    leaderboard = leaderboard.sort((a: { address: string, points: number; }, b: { address: string, points: number; }) => {
      return b.points - a.points;
    });
    const me = leaderboard.find((value) => value.address === publicKey?.toString())!;
    setMe(me);
    leaderboard = leaderboard.splice(0, leaderboard.length > 5 ? 5 : leaderboard.length);
    let includes: boolean = false;
    for (const item of leaderboard) {
      if (item.address == publicKey?.toString()) {
        includes = true;
        break;
      }
    }
    setInTop5(includes);
    setLeaderboard(leaderboard);
  };
  const originToCanvasCoords = (x: number, y: number) => {
    //converts distances relative to origin to relative to top corner of canvas
    return [x + canvas.width / 2, y + canvas.height / 2];
  };
  const drawPlayer = (x: number, y: number, angle: number, width: number, height: number, imgSrc: string, grapplePressed: boolean, grapplePosition: [number, number], health: number) => {
    const img = imgMap.get(imgSrc);
    if (grapplePressed) {
      context.strokeStyle = "white";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(canvas.width / 2, canvas.height / 2);
      let adjX = (canvas.width / 2) + grapplePosition[0] - x;
      let adjY = (canvas.height / 2) + grapplePosition[1] - y;
      context.lineTo(adjX, adjY);
      context.stroke();
      context.beginPath();
      context.arc(adjX, adjY, 5, 0, 2 * Math.PI);
      context.fillStyle = 'red';
      context.fill();
    }
    try {
      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(angle);
      context.drawImage(img!, -1 * width / 2, -1 * height / 2, width, height);
      context.restore();
    } catch (e) {
      console.error(e);
      console.log({ imgSrc, src: img!.src });
    }
    //translate and draw image

    //draw circle
    context.beginPath();
    context.arc(canvas.width / 2, canvas.height / 2, width * 3, 0, 2 * Math.PI);
    context.lineWidth = 1;
    context.strokeStyle = "green";
    context.stroke();

    drawHealthbar(canvas.width / 2, canvas.height / 2 + 10, health);
  };
  const drawHealthbar = (x: number, y: number, health: number) => {
    const width = 50;
    const height = 5;
    context.strokeStyle = "white";
    context.beginPath();
    context.rect(x - width / 2, y, width, height);
    context.stroke();
    const percentage = health / MAX_HEALTH;
    context.fillStyle = percentage > .75 ? "green" : percentage > .25 ? "yellow" : "red";
    context.fillRect(x - width / 2, y, percentage * width, height);
  };
  const drawName = (x: number, y: number, teamColor: string, address: string) => {
    context.font = '15px Arial';
    context.fillStyle = teamColor;
    context.textAlign = "center";
    context.fillText(shortenShortenAddress(address), x, y);
  };
  const drawObject = (angle: number, relX: number, relY: number, width: number, height: number, imgSrc: string, health: number, color: string, teamColor: string, address: string) => {
    context.save();
    [relX, relY] = originToCanvasCoords(relX, relY);
    context.translate(relX, relY);
    context.rotate(angle ?? 0);
    if (imgSrc) {
      const img = imgMap.get(imgSrc);
      if (!img) alert(`${imgSrc}, ${img}, ${height}`);
      context.drawImage(img!, -1 * width / 2, -1 * height / 2, width, height);
    } else if (color !== "") {
      context.beginPath();
      context.arc(-1 * width / 2, -1 * height / 2, width, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();
    } else {
      context.beginPath();
      context.arc(-1 * width / 2, -1 * height / 2, width, 0, Math.PI * 2);
      context.fillStyle = "red";
      context.fill();
    }
    context.restore();
    if (health) {
      drawHealthbar(relX, relY + 10, health);
    }
    if (teamColor) {
      console.log(teamColor);
      drawName(relX, relY - 10, teamColor, address);
    }
  };
  const resetCanvas = (center: [number, number]) => {
    let [x, y] = center;
    context.save();
    context.translate(-1 * x, -1 * y);
    //todo: make this more efficient using % and only drawing around player
    for (let x = 0; x < 15; x++) {
      for (let y = 0; y < 15; y++) {
        context.drawImage(backgroundImage, x * 1000, y * 1000, 1000, 1000);
      }
    }
    context.strokeStyle = "red";
    context.strokeRect(canvas.width / 2, canvas.height / 2, 10000, 10000);
    context.restore();
  };
  return (
    <div className="w-screen h-screen relative" style={{ backgroundImage: `url("/space-fight/background.png")` }}>
      <canvas id="canvas" />
      {succeededTransaction &&
        <div className="fixed bottom-0 left-0 ml-6 mb-6">
          <TransactionSuccess />
        </div>
      }
      {failedTransaction &&
        <div className="fixed bottom-0 left-0 ml-6 mb-6">
          <TransactionFailure />
        </div>
      }
      {sendingTransaction &&
        <div className="fixed bottom-0 left-0 ml-6 mb-6">
          <TransactionPending />
        </div>
      }
      {!isPlaying &&
        <div className="absolute top-0 left-0 bg-transparent w-full h-full flex justify-center items-center z-10">
          <div className="border-white border-2 max-w-5xl rounded-xl p-8 flex flex-col justify-center items-center ">
            <div className="grid grid-cols-2 items-center place-items-center gap-2 px-2 w-full">
              <Select text="Teams" selected={gameMode === "Teams"} onClick={() => setGameMode("Teams")} />
              <Select text="FFA" disabled selected={gameMode === "FFA"} onClick={() => setGameMode("FFA")} />
            </div>
            <p className="text-8xl text-center" style={{ fontFamily: "SankofaDisplay" }}>Shitcoin Arena</p>
            <div className="carousel p-4 space-x-4 max-w-4xl rounded-box">
              {ships.map((data: any, i: number) => {
                return (
                  <div className="carousel-item card card-compact w-64 bg-base-100 shadow-xl" key={i}>
                    <figure>
                      <img src={data.src} className="h-48 p-4" />
                    </figure>
                    <div className="card-body">
                      <h2 className="card-title justify-center">{data.name}</h2>
                      {/* <p className="text-center">{data.description}</p> */}
                      <div className="card-actions justify-center">
                        <button onClick={() => setSelectedShip(data)} className="btn btn-primary" disabled={selectedShip.name === data.name}>{selectedShip.name === data.name ? "Selected" : "Select"}</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* User picks spaceship, sets base price. Then adjusts price, increasing chance of getting power ups */}
            <div className="flex flex-row w-full justify-center items-center gap-5 px-10">
              <div className="w-[50%]">
                <input type="range" min={0} max="100" value={luckAmount} onChange={(event: any) => setLuckAmount(Number(event.target.value))} className="range" />
                <div className="flex flex-row justify-center gap-2">
                  <p>Luck: {luckAmount}</p>
                  <p>$SOL Price: {Math.round((luckAmount * 0.01 + selectedShip.price) * 100) / 100}</p>
                </div>
              </div>
              <div className="w-[50%]">
                <CustomDropdown values={coins} title="Select Coin" onChange={(c: any) => setSelectedCoin(c)} />
              </div>
            </div>
            <div className="w-full grid grid-cols-3 place-items-center items-center mt-4 gap-4">
              <WalletMultiButtonDynamic />
              <BasicButton text="Play" onClick={play} />
              <ServerDropdown values={servers} title="Select Server" onChange={(s) => setSelectedServer(s)} />
            </div>
          </div>
        </div>
      }
      {isPlaying &&
        <div id="toggle" className="absolute flex flex-col justify-center items-center bottom-0 right-0 m-2">
          <div className="flex flex-col justify-center items-center">
            {gameMessages.map((message: string[], i: number) => (
              <p key={i}>
                <span className="text-green-600 font-bold">{`${message[0] === "Asteroid" ? `${message[0]}` : shortenAddress(message[0])}`}</span>
                {` killed `}
                <span className="text-red-600 font-bold">{`${shortenAddress(message[1])}`}</span>
              </p>
            ))}
          </div>
        </div>
      }
      {leaderboard && leaderboard.length > 0 &&
        <div id="leaderboard" className="absolute top-0 right-0 m-4 w-[20%] h-auto bg-gray-800/60 rounded-lg p-4">
          {leaderboard.map((value: { address: string, points: number; }, i: number) => {
            return (
              <LeaderboardRow {...value} targetAddress={publicKey?.toString()} key={i} />
            );
          })}
          {inTop5 ?
            <></>
            :
            me ?
              <>
                <SmallGap />
                <LeaderboardRow {...me} targetAddress={publicKey?.toString()} />
              </>
              :
              <></>
          }
        </div>
      }
      {tokenLeaderboard && tokenLeaderboard.length > 0 &&
        <div className="absolute top-0 left-0 m-4 w-[25%] h-auto bg-gray-800/60 rounded-lg p-4">
          {tokenLeaderboard.map((value, i) => <TokenLeaderboardRow {...value} key={i} />)}
          {!tokenInTop5 && myToken &&
            <>
              <SmallGap />
              <TokenLeaderboardRow {...myToken} />
            </>
          }

        </div>
      }
      {isPlaying && (killedBy !== "" || mainMessages.size > 0) &&
        <div className="absolute flex justify-center items-center w-full h-full top-0 left-0">
          <div className="flex flex-col justify-center items-center gap-2 rounded-md bg-slate-700/75 p-4">
            {killedBy !== "" ? <p style={{ userSelect: "none" }}>{`You were killed by `}<span className="text-red-600 font-bold">{killedBy}</span></p> : <></>}
            {Array.from(mainMessages).map((value: [number, string], i: number) => {
              return (
                <>
                  {processStringToHTML(value[1])}
                </>
              );
            })}
          </div>
        </div>
      }
    </div>
  );
}
const processStringToHTML = (str: string) => {
  type Types = "green" | "null";
  const textType: [Types, string][] = [];
  let curr = "";
  let open = "";
  for (let i = 0; i < str.length; i++) {
    if (str[i] == "*") {
      if (open !== "") {
        open = "";
        textType.push(["green", curr]);
        curr = "";
      } else {
        textType.push(["null", curr]);
        curr = "";
        open = "*";
      }
    } else {
      curr += str[i];
    }
  }
  textType.push(["null", curr]);
  return (
    <p style={{ userSelect: "none" }} key={Math.random()}>
      {textType.map((value: [Types, string], i: number) => {
        if (value[0] == "null") {
          return (
            ` ${value[1]} `
          );
        } else {
          return (
            <span className="text-green-600 font-bold" key={i}>
              {value[1]}
            </span>
          );
        }
      })}
    </p>
  );
};
function LeaderboardRow({ address, points, targetAddress }: { address: string, points: number, targetAddress?: string; }) {
  if (targetAddress === address) {
    return (
      <div className="flex flex-row justify-between items-center w-full h-auto">
        <p className="text-yellow-600 font-bold">{shortenAddress(address)}</p>
        <p>{points}</p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-row justify-between items-center w-full h-auto">
        <p>{shortenAddress(address)}</p>
        <p>{points}</p>
      </div>
    );
  }
}

const SmallGap = () => (<div className="h-2"></div>);

function TokenLeaderboardRow({ img, name, address, color, points }: any) {
  return (
    <div className="w-full flex flex-row justify-between items-center px-4 py-2" style={{ color }}>
      <img src={img} className="w-10 aspect-square rounded-full" />
      <p>{name}</p>
      <p>{points}</p>
      <a href={`https://birdeye.so/token/${address}`} className="hover:underline" target="_blank">{shortenShortenAddress(address)}</a>
    </div>
  );
}