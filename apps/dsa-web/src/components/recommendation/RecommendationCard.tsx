import React, { useEffect, useState } from 'react';
import { recommendationApi } from '../../api/analysis';
import type { RecommendationStock } from '../../api/analysis';
import { StatusDot } from '../common';
import { TrendingUp, TrendingDown, Minus, RefreshCw, X } from 'lucide-react';

type StockCardProps = {
  stock: RecommendationStock;
  rank: number;
  onDetail: (stock: RecommendationStock) => void;
};

const StockCard: React.FC<StockCardProps> = ({ stock, rank, onDetail }) => {
  const isUp = stock.changePct > 0;
  const isDown = stock.changePct < 0;

  return (
    <div className="home-subpanel px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-gradient text-[9px] font-bold text-primary-foreground shadow-[0_0_6px_hsl(var(--primary)/0.3)]">
            {rank}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">{stock.name}</span>
          <span className="shrink-0 text-[10px] text-muted-text font-mono tracking-tight">{stock.code}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isUp ? <TrendingUp className="h-3 w-3 text-success" /> : isDown ? <TrendingDown className="h-3 w-3 text-danger" /> : <Minus className="h-3 w-3 text-muted-text" />}
          <span className={`text-[11px] font-mono tabular-nums ${isUp ? 'text-success' : isDown ? 'text-danger' : 'text-muted-text'}`}>
            {stock.changePct > 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-text">¥<span className="font-semibold text-foreground font-mono">{stock.currentPrice.toFixed(2)}</span></span>
        <button
          type="button"
          onClick={() => onDetail(stock)}
          className="home-accent-pill-link px-2 py-0.5 text-[10px]"
        >
          详情
        </button>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-secondary-text line-clamp-2">
        {stock.reason}
      </p>
    </div>
  );
};

type DetailModalProps = {
  stock: RecommendationStock | null;
  onClose: () => void;
};

const DetailModal: React.FC<DetailModalProps> = ({ stock, onClose }) => {
  useEffect(() => {
    if (stock) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [stock]);

  if (!stock) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="dashboard-card w-full max-w-md p-5 animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-foreground">{stock.name}</span>
            <span className="text-xs text-muted-text font-mono">{stock.code}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="home-surface-button flex items-center rounded-lg p-1.5 text-secondary-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-4">
          <div>
            <span className="text-[11px] text-muted-text">当前价格</span>
            <p className="text-lg font-semibold text-foreground font-mono">¥{stock.currentPrice.toFixed(2)}</p>
          </div>
          <div>
            <span className="text-[11px] text-muted-text">涨跌幅</span>
            <p className={`text-lg font-semibold font-mono ${stock.changePct > 0 ? 'text-success' : stock.changePct < 0 ? 'text-danger' : 'text-muted-text'}`}>
              {stock.changePct > 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
            </p>
          </div>
        </div>

        <div>
          <span className="text-[11px] text-muted-text mb-1 block">筛选理由</span>
          <div className="home-subpanel px-3 py-2.5">
            <p className="text-xs leading-relaxed text-secondary-text whitespace-pre-wrap">
              {stock.reason}
            </p>
          </div>
        </div>

        <p className="mt-4 text-[9px] text-muted-text text-center opacity-60">
          基于 AI 策略筛选 · 仅供参考，投资需谨慎
        </p>
      </div>
    </div>
  );
};

const STORAGE_KEY = 'ais_rec_stocks';
const STORAGE_TIME_KEY = 'ais_rec_time';

export const RecommendationCard: React.FC = () => {
  const [stocks, setStocks] = useState<RecommendationStock[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailStock, setDetailStock] = useState<RecommendationStock | null>(null);

  const saveToStorage = (data: RecommendationStock[]) => {
    setStocks(data);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      sessionStorage.setItem(STORAGE_TIME_KEY, Date.now().toString());
    } catch {}
  };

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendationApi.getRecommendations();
      saveToStorage(res.stocks);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取推荐失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const now = new Date();
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30, 0);
    const msUntil930 = target.getTime() - now.getTime();
    if (msUntil930 > 0) {
      const timer = setTimeout(fetch, msUntil930);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <div className="dashboard-card p-3 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">📈 新手推荐</span>
            <StatusDot tone={loading ? 'warning' : 'success'} />
          </div>
          <button
            type="button"
            onClick={fetch}
            disabled={loading}
            className="home-surface-button flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-secondary-text"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {error ? (
          <p className="text-xs text-danger px-1 py-4 text-center">{error}</p>
        ) : loading && stocks.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="home-spinner h-5 w-5 border-2" />
          </div>
        ) : stocks.length === 0 ? (
          <p className="text-xs text-muted-text text-center py-6">暂无推荐数据</p>
        ) : (
          <div className="space-y-2">
            {stocks.map((stock, i) => (
              <StockCard key={stock.code} stock={stock} rank={i + 1} onDetail={setDetailStock} />
            ))}
          </div>
        )}

        <p className="mt-3 text-[9px] text-muted-text text-center opacity-60">
          基于 AI 策略筛选 · 仅供参考，投资需谨慎
        </p>
      </div>

      <DetailModal stock={detailStock} onClose={() => setDetailStock(null)} />
    </>
  );
};
