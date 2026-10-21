load('EXP3.mat')
graycolor = [0.2 0.2 0.2];
uniqsub = unique(data.subjects);
uniqcon = unique(data.condition).';
nsub = length(uniqsub);
ncond = length(uniqcon);

perf = nan(nsub,ncond);
for isub = 1:nsub
    for icond = 1:ncond
        idx = (data.subjects==uniqsub(isub)) & (data.condition==uniqcon(icond));
        perf(isub,icond) = mean(data.correct(idx));
    end
end

mPerf = mean(perf);
sPerf = std(perf)/sqrt(nsub);

figure();
xlim([-10 10]);
b = bar(uniqcon,mPerf,'barWidth',0.5,'LineWidth',2,'EdgeColor',graycolor,'FaceAlpha',0.6,'FaceColor',graycolor);  
hold on 
errorbar(uniqcon,mPerf,sPerf,sPerf,'.','LineWidth',2,'Color',graycolor);
plot(get(gca,'Xlim'),[0.5 0.5],'--','LineWidth',1.2,'Color',graycolor);
plot([0,0],[0.3,0.7],'-','LineWidth',2,'Color',graycolor);
ylim([0.3,0.7]);
xlabel('Foil distance from Target (deg)');
ylabel('Accuracy');
set(gca,'XTick',uniqcon,'XTickLabel',uniqcon,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
title('Figure3b')