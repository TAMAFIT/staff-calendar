import { APP_NAME } from "../config.js";

export function renderAppShell(content, {
  title = APP_NAME,
  subtitle = "スタッフカレンダー",
  backAction = "",
  showAdd = true,
  isRefreshing = false
} = {}) {
  return `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-header__inner">
          ${backAction ? `
            <button class="icon-button" type="button" data-action="${backAction}" aria-label="前の画面へ戻る">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="app-header__copy">
              <span>${subtitle}</span>
              <strong>${title}</strong>
            </div>
          ` : `
            <button class="header-home" type="button" data-action="go-home" aria-label="ホームに戻る">
              <span class="brand-mark" aria-hidden="true">T</span>
              <span class="app-header__copy">
                <span>${subtitle}</span>
                <strong>${title}</strong>
              </span>
            </button>
          `}
          ${isRefreshing ? `<span class="refresh-status" role="status"><i aria-hidden="true"></i>更新中</span>` : ""}
          ${showAdd ? `
            <button class="header-add-button" type="button" data-action="new-booking" aria-label="予約を追加">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          ` : `<span class="app-header__spacer" aria-hidden="true"></span>`}
        </div>
      </header>
      <main class="app-main">${content}</main>
    </div>
  `;
}

export function renderLoading() {
  return `
    <div class="app-shell">
      <div class="loading-screen" role="status">
        <div class="loading-mark">T</div>
        <div class="loading-spinner" aria-hidden="true"></div>
        <p>予約を読み込んでいます</p>
      </div>
    </div>
  `;
}

export function renderError(message) {
  return renderAppShell(`
    <section class="state-panel">
      <span class="state-panel__icon" aria-hidden="true">!</span>
      <h2>読み込みに失敗しました</h2>
      <p>${message}</p>
      <button class="button button--primary" type="button" data-action="reload">もう一度試す</button>
    </section>
  `);
}
