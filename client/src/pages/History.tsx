import { useOpenedBottles } from "@/hooks/use-opened";
import { WineIcon } from "@/components/WineIcon";
import { format } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import { Star } from "lucide-react";
import { t } from "@/i18n";

export default function History() {
  const { data: opened, isLoading } = useOpenedBottles();

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in-fade">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground">{t("history.title")}</h2>
        <p className="text-muted-foreground">{t("history.subtitle")}</p>
      </div>

      <div className="space-y-4">
        {opened && opened.length > 0 ? (
          opened.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-muted/20 flex items-center justify-center border border-border/50">
                  <WineIcon className="w-8 h-8" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-display font-bold text-lg leading-tight">{item.wine || t("history.unknownWine")}</h3>
                    <p className="text-muted-foreground">{item.producer} • <span className="text-foreground font-medium">{item.vintage}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium block uppercase tracking-wider mb-1">{t("history.opened")}</span>
                    <span className="text-sm font-medium">
                      {item.openedAt ? format(new Date(item.openedAt), "d MMM yyyy", { locale: frLocale }) : t("history.unknownDate")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row gap-4 border-t border-border/50 pt-4">
                  {item.tastingNotes ? (
                    <div className="flex-1 text-sm text-foreground/80 italic">
                      "{item.tastingNotes}"
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-muted-foreground italic">
                      {t("history.noNotes")}
                    </div>
                  )}
                  
                  {item.rating100 && (
                     <div className="flex items-center gap-1 bg-accent/20 px-3 py-1 rounded-full self-start sm:self-center">
                       <Star className="w-4 h-4 fill-accent text-accent-foreground" />
                       <span className="font-bold text-accent-foreground">{item.rating100}</span>
                       <span className="text-xs text-muted-foreground">/100</span>
                     </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-2xl border border-dashed border-border">
            {t("history.empty")}
          </div>
        )}
      </div>
    </div>
  );
}
