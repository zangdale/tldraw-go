import { useLayoutEffect, useState } from "react";
import {
  Tldraw,
  createTLStore,
  defaultShapeUtils,
  throttle,
  DefaultMainMenu,
  DefaultMainMenuContent,
  TLComponents,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  TldrawUiMenuSubmenu,
  TLStoreSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import _jsonSnapshot from "./snapshot.json";

const PERSISTENCE_KEY = "tldraw-local_storage";

const jsonSnapshot = _jsonSnapshot as TLStoreSnapshot;

function App() {
  //[1]
  const [store] = useState(() =>
    createTLStore({ shapeUtils: defaultShapeUtils })
  );

  //[2]
  const [loadingState, setLoadingState] = useState<
    | { status: "loading" }
    | { status: "ready" }
    | { status: "error"; error: string }
  >({
    status: "loading",
  });

  //[3]
  useLayoutEffect(() => {
    setLoadingState({ status: "loading" });

    // Get persisted data from local storage
    const persistedSnapshot = localStorage.getItem(PERSISTENCE_KEY);

    if (persistedSnapshot) {
      try {
        const snapshot = JSON.parse(persistedSnapshot);
        store.loadSnapshot(snapshot);
        setLoadingState({ status: "ready" });
      } catch (error: any) {
        setLoadingState({ status: "error", error: error.message }); // Something went wrong
      }
    } else {
      setLoadingState({ status: "ready" }); // Nothing persisted, continue with the empty store
    }

    // Each time the store changes, run the (debounced) persist function
    const cleanupFn = store.listen(
      throttle(() => {
        const snapshot = store.getSnapshot();
        localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(snapshot));
      }, 500)
    );

    return () => {
      cleanupFn();
    };
  }, [store]);

  // [4]
  if (loadingState.status === "loading") {
    return (
      <div className="tldraw__editor">
        <h2>Loading...</h2>
      </div>
    );
  }

  if (loadingState.status === "error") {
    return (
      <div className="tldraw__editor">
        <h2>Error!</h2>
        <p>{loadingState.error}</p>
      </div>
    );
  }

  function CustomMainMenu() {
    return (
      <DefaultMainMenu>
        <div style={{ backgroundColor: "" }}>
          <TldrawUiMenuGroup id="file_menu">
            <TldrawUiMenuSubmenu id="file_menu_sub" label="文件">
              <TldrawUiMenuItem
                id="file_menu_sub_new"
                label="清屏"
                readonlyOk
                onSelect={() => {
                  store.loadSnapshot(jsonSnapshot);
                }}
              />
              <TldrawUiMenuItem
                id="file_menu_sub_load"
                label="打开"
                readonlyOk
                onSelect={() => {
                  const inpEle = document.createElement("input");
                  inpEle.id = `__file_${Math.trunc(Math.random() * 100000)}`;
                  inpEle.type = "file";
                  inpEle.style.display = "none";
                  // 文件类型限制
                  inpEle.accept = ".json";
                  // 多选限制
                  inpEle.multiple = false;
                  inpEle.addEventListener(
                    "change",
                    () => {
                      if (inpEle.files == null) {
                        setLoadingState({
                          status: "error",
                          error: "file error",
                        });
                        return;
                      } else {
                        console.log("files0", inpEle.files[0]);
                        const fileObj = inpEle.files[0];
                        const reader = new FileReader();
                        reader.readAsText(fileObj, "utf8");
                        reader.onload = () => {
                          const sn = JSON.parse(
                            reader.result as string
                          ) as TLStoreSnapshot;
                          console.log(sn);
                          store.loadSnapshot(sn);
                        };
                      }
                    },
                    { once: true }
                  );
                  inpEle.click();
                }}
              />
              <TldrawUiMenuItem
                id="file_menu_sub_save"
                label="保存"
                readonlyOk
                onSelect={() => {
                  const snapshot = store.getSnapshot();
                  var blob = new Blob([JSON.stringify(snapshot)], {
                    type: "application/json",
                  });

                  // 不是IE浏览器使用的下面的
                  var url = window.URL.createObjectURL(blob);
                  // 上面这个是创建一个blob的对象连链接，
                  var link = document.createElement("a");
                  // 创建一个链接元素，是属于 a 标签的链接元素，所以括号里才是a，

                  link.href = url;
                  // 把上面获得的blob的对象链接赋值给新创建的这个 a 链接
                  link.setAttribute("download", "result.json");
                  // 设置下载的属性（所以使用的是download），这个是a 标签的一个属性
                  // 后面的是文件名字，可以更改
                  link.click();
                  // 使用js点击这个链接
                }}
              />
            </TldrawUiMenuSubmenu>
          </TldrawUiMenuGroup>
        </div>
        <DefaultMainMenuContent />
      </DefaultMainMenu>
    );
  }

  const components: TLComponents = {
    MainMenu: CustomMainMenu,
  };

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw store={store} components={components} />
    </div>
  );
}

export default App;
