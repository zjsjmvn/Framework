export default class BigNumberLabelUtil{
    static arr = ['','k','m','b','t','q','Q','Max'];
    /**
     * KM string (1000=1k,1000k = 1M,1000M =  1b)
     */
    public static numberToKMString(num:number,fixedCount=2){
        let index = 0;
        if (num<1000){
            fixedCount = 0;
        }
        while(num){
            if (num<1000){
                break;
            }
            num/=1000;
            index++;
        }
        
        return num.toFixed(fixedCount).toString()+BigNumberLabelUtil.arr[index];
    }
}



