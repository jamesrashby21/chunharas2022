load('EXP2.mat')
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

%% Figure 2b

maincond = uniqcon(1:end-1);
catchtrl = uniqcon(end);
mainperf = perf(:,1:end-1);

mPerf = mean(mainperf);
sPerf = std(mainperf)/sqrt(nsub);

figure();
xlim([-10 10]);
b = bar([-1.5 -0.5 0.5 1.5],mPerf,'barWidth',0.5,'LineWidth',2,'EdgeColor',[0.2 0.2 0.2],'FaceAlpha',0.6,'FaceColor',[0.2 0.2 0.2]);  
hold on 
errorbar([-1.5 -0.5 0.5 1.5],mPerf,sPerf,sPerf,'.','LineWidth',2,'Color',[0.2 0.2 0.2]);
plot(get(gca,'Xlim'),[0.5 0.5],'--','LineWidth',1.2,'Color',[0.2 0.2 0.2]);
plot([0,0],[0.8,0.2],'-','LineWidth',2,'Color',[0.2 0.2 0.2]);
ylim([0.2,0.8]);
xlabel('Foil distance from Target (deg)');
ylabel('Accuracy');
set(gca,'XTick',[-1.5 -0.5 0.5 1.5],'XTickLabel',maincond,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
title('Figure2b')

%% Figure 2c
catchperf = perf(:,end)*100;
diffperf = (mean(mainperf(:,[1,2]),2)-mean(mainperf(:,[3,4]),2))*100;
coef = polyfit(catchperf,diffperf,1);
xlimit = [20,105];

figure();
scatter(catchperf+randn(size(catchperf)),diffperf+randn(size(catchperf)),'filled','MarkerFaceAlpha',0.6,'MarkerFaceColor',graycolor);
hold on 
plot(xlimit,xlimit*coef(1)+coef(2),'LineWidth',2,'Color',graycolor)
plot([50,50],[-50,50],':','LineWidth',2,'Color',graycolor);
plot(xlimit,[0,0],':','LineWidth',2,'Color',graycolor);
ylim([-50,50]);
xlim(xlimit);
set(gca,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
xlabel('catch trial performance (%)')
ylabel('repulsion bias (%)')
title('Figure2c');

%% Figure 2d

niti = 5000;
bootCorr = nan(niti,1);
for iti = 1:niti
    sampId = datasample(1:nsub,nsub);
    bootCorr(iti) = corr(catchperf(sampId),diffperf(sampId));
end
figure();
histogram(bootCorr,200,'EdgeAlpha',0);hold on 
plot([0,0],[0,100],'LineStyle',':','LineWidth',2)
xlabel('Pearson''s r');
ylabel('counts');
set(gca,'linewidth',3,'FontName','Helvectica','FontSize',12,'box','on')
title('Figure 2d');

% In the paper, we used distributionPlot.m from https://www.mathworks.com/matlabcentral/fileexchange/23661-violin-plots-for-plotting-multiple-distributions-distributionplot-m
% distributionPlot(bootCorr)
