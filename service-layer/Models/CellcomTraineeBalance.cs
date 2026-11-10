namespace Aviv_Service.Models;

/// <summary>מה שספק סלקום יודע על חניך אחד (L-6): יתרת הדקות ודגל "פער בנתונים מול סלקום" (ספק 01 §4).</summary>
public record CellcomTraineeBalance(int NumbRemainingMinutes, bool HasCellcomDiscrepancy);
