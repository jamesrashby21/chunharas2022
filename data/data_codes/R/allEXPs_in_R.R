setwd("~/yourWorkingDirectory/.../data_codes/R") # <- please change this to your own path

#### EXP1 ####
dat = 'EXP1_subj_fdist_fdirec_val.csv'
datcsv = read.csv(dat, header = FALSE)
colnames(datcsv) = c('subj','fdist','fdirec','val')

datcsv$subj = as.factor(datcsv$subj)
datcsv$fdirec = as.factor(datcsv$fdirec)

# t-test 
t.test(datcsv[datcsv$fdirec==-1,'val']-datcsv[datcsv$fdirec==1,'val'])

#### EXP2 ####
dat = 'EXP2_subj_fdist_fdirec_val.csv'
datcsv = read.csv(dat, header = FALSE)
colnames(datcsv) = c('subj','fdist','fdirec','val')

datcsv$subj = as.factor(datcsv$subj)
datcsv$fdirec = as.factor(datcsv$fdirec)

main = subset(datcsv,fdirec!=0)
# repeated-measures ANOVA
summary(aov(val~(fdirec*fdist) + Error(subj/(fdirec*fdist)),main))

# t-test 
t.test(0.5-subset(main,fdist==6 & fdirec ==1)$val)
t.test(0.5-subset(main,fdist==25 & fdirec ==1)$val)
t.test(0.5-subset(main,fdist==6 & fdirec ==-1)$val)
t.test(0.5-subset(main,fdist==25 & fdirec ==-1)$val)

# correlation between baseline performance (catch trials) vs. repulsion bias
uniqSubj = unique(main$subj)
repulsionBias = numeric(length(uniqSubj))
for(i in 1:length(uniqSubj)){
  repulsionBias[i] =mean(subset(main,fdirec ==-1 & subj==uniqSubj[i])$val)-mean(subset(main,fdirec ==1 & subj==uniqSubj[i])$val)
}
catch = subset(datcsv,fdirec==0)$val
cor.test(catch,repulsionBias)


#### EXP3 ####
dat = 'EXP3_subj_fdist_fdirec_val.csv'
datcsv = read.csv(dat, header = FALSE)
colnames(datcsv) = c('subj','fdist','fdirec','val')

datcsv$subj = as.factor(datcsv$subj)
datcsv$fdirec = as.factor(datcsv$fdirec)

# repeated-measures ANOVA
summary(aov(val~(fdist*fdirec) + Error(subj/(fdist*fdirec)),datcsv))

# check means
aggregate(datcsv$val,list(datcsv$fdist),mean)
aggregate(datcsv$val,list(datcsv$fdirec),mean)

# Post-hoc t-test 
t.test(0.5-subset(datcsv,fdist==10 & fdirec == 1)$val)
t.test(0.5-subset(datcsv,fdist==20 & fdirec == 1)$val)
t.test(0.5-subset(datcsv,fdist==30 & fdirec == 1)$val)
t.test(0.5-subset(datcsv,fdist==10 & fdirec ==-1)$val)
t.test(0.5-subset(datcsv,fdist==20 & fdirec ==-1)$val)
t.test(0.5-subset(datcsv,fdist==30 & fdirec ==-1)$val)

#### EXP4 ####
dat = 'EXP4_subj_encd_coldis_val_circSTD.csv'
datcsv = read.csv(dat, header = FALSE)
colnames(datcsv) = c('subj','encd','coldis','val','cSD')

datcsv$subj = as.factor(datcsv$subj)
datcsv$encd = as.factor(datcsv$encd)
datcsv$coldis = as.factor(datcsv$coldis)

# repeated-measures ANOVA
summary(aov(cSD~(encd*coldis) + Error(subj/(encd*coldis)),datcsv))
summary(aov(val~(encd*coldis) + Error(subj/(encd*coldis)),datcsv))

# check means
aggregate(datcsv$cSD,list(datcsv$encd),mean)
aggregate(datcsv$cSD,list(datcsv$coldis),mean)

aggregate(datcsv$val,list(datcsv$encd),mean)
aggregate(datcsv$val,list(datcsv$coldis),mean)
